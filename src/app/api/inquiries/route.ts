import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { createInquirySchema, inquiryFiltersSchema } from '@/lib/validations'
import { hasPermission } from '@/lib/auth'
import { onInquiryCreated } from '@/lib/automation/hooks'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'inquiries', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams)
    
    // Convert numeric params from strings and handle status/priority as arrays
    const params = {
      ...rawParams,
      page: rawParams.page ? parseInt(rawParams.page, 10) : undefined,
      limit: rawParams.limit ? parseInt(rawParams.limit, 10) : undefined,
      status: rawParams.status ? [rawParams.status] : undefined,
      priority: rawParams.priority ? [rawParams.priority] : undefined,
    }
    
    const filters = inquiryFiltersSchema.parse(params)

    const where: any = {}

    // Apply role-based filtering
    if (session.user.role === 'SALES') {
      where.createdById = session.user.id
    } else if (session.user.role === 'VPP') {
      where.OR = [
        { assignedToId: session.user.id },
        { status: 'SUBMITTED' }
      ]
    } else if (session.user.role === 'VP') {
      where.items = {
        some: { assignedToId: session.user.id }
      }
    }

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status }
    }

    if (filters.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority }
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId
    }

    if (filters.customerId) {
      where.customerId = filters.customerId
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
      if (filters.dateTo) where.createdAt.lte = filters.dateTo
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } }
      ]
    }

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          customer: true,
          createdBy: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              assignedTo: { select: { id: true, name: true, email: true } },
              costCalculation: true,
            }
          },
          _count: {
            select: { items: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.inquiry.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: inquiries,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    })
  } catch (error) {
    console.error('Get inquiries error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'inquiries', 'write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    console.log('POST /api/inquiries - Request body:', JSON.stringify(body, null, 2))
    
    // Extract attachmentIds before validation (not part of schema)
    const { attachmentIds, ...inquiryData } = body
    
    const validatedData = createInquirySchema.parse(inquiryData)
    console.log('POST /api/inquiries - Validated data:', JSON.stringify(validatedData, null, 2))

    const inquiry = await prisma.inquiry.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        deadline: validatedData.deadline,
        customerId: validatedData.customerId,
        createdById: session.user.id,
        items: {
          create: validatedData.items.map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes,
            priceEstimation: item.priceEstimation,
            requestedDelivery: item.requestedDelivery,
          }))
        },
        // Create attachments if provided
        ...(attachmentIds && attachmentIds.length > 0 && {
          attachments: {
            create: attachmentIds.map((fileId: string) => ({
              attachmentId: fileId
            }))
          }
        })
      },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: true,
        attachments: {
          include: {
            attachment: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Inquiry',
        entityId: inquiry.id,
        newData: {
          title: inquiry.title,
          status: inquiry.status,
          customerId: inquiry.customerId,
        },
        userId: session.user.id,
        inquiryId: inquiry.id,
      }
    })

    // Trigger automation rules
    await onInquiryCreated(inquiry.id, inquiry)

    return NextResponse.json({
      success: true,
      data: inquiry,
      message: 'Inquiry created successfully',
    })
  } catch (error) {
    console.error('Create inquiry error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}