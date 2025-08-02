import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { costCalculationSchema } from '@/lib/validations'
import { sendNotificationEmail } from '@/lib/email'
import { optimizedAuth } from '@/utils/supabase/optimized-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await optimizedAuth.getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const calculatedBy = searchParams.get('calculatedBy')
    const approved = searchParams.get('approved')

    const where: any = {}

    // Apply role-based filtering
    if (user.role === 'VP') {
      where.calculatedById = user.id
    }

    if (itemId) {
      where.inquiryItemId = itemId
    }

    if (calculatedBy) {
      where.calculatedById = calculatedBy
    }

    if (approved !== null) {
      where.isApproved = approved === 'true'
    }

    const costCalculations = await db.costCalculation.findMany({
      where,
      include: {
        inquiryItem: {
          include: {
            inquiry: {
              include: {
                customer: { select: { id: true, name: true } }
              }
            },
            assignedTo: { select: { id: true, name: true, email: true } }
          }
        },
        calculatedBy: { select: { id: true, name: true, email: true } },
        approvals: {
          include: {
            approver: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: costCalculations,
    })
  } catch (error) {
    console.error('Get cost calculations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await optimizedAuth.getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canCalculateCosts(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { inquiryItemId, ...costData } = body
    
    if (!inquiryItemId) {
      return NextResponse.json(
        { error: 'Inquiry item ID is required' },
        { status: 400 }
      )
    }

    const validatedData = costCalculationSchema.parse(costData)

    // Verify the inquiry item exists and is assigned to the user
    const inquiryItem = await db.inquiryItem.findUnique({
      where: { id: inquiryItemId },
      include: {
        inquiry: { select: { id: true, title: true, status: true } },
        costCalculation: { select: { id: true } }
      }
    }) as any

    if (!inquiryItem) {
      return NextResponse.json(
        { error: 'Inquiry item not found' },
        { status: 404 }
      )
    }

    // Check if user can calculate costs for this item
    if (user.role === 'VP' && inquiryItem.assignedToId !== user.id) {
      return NextResponse.json(
        { error: 'You can only calculate costs for items assigned to you' },
        { status: 403 }
      )
    }

    // Check if cost calculation already exists
    if (inquiryItem.costCalculation) {
      return NextResponse.json(
        { error: 'Cost calculation already exists for this item' },
        { status: 400 }
      )
    }

    // Check if item is in correct status
    if (!['ASSIGNED', 'IN_PROGRESS'].includes(inquiryItem.status)) {
      return NextResponse.json(
        { error: 'Item must be assigned or in progress to calculate costs' },
        { status: 400 }
      )
    }

    // Calculate total cost
    const totalCost = validatedData.materialCost + validatedData.laborCost + validatedData.overheadCost

    // Create cost calculation in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the cost calculation
      const costCalculation = await tx.costCalculation.create({
        data: {
          materialCost: validatedData.materialCost,
          laborCost: validatedData.laborCost,
          overheadCost: validatedData.overheadCost,
          totalCost: totalCost,
          notes: validatedData.notes,
          inquiryItemId: inquiryItemId,
          calculatedById: user.id,
        },
        include: {
          inquiryItem: {
            include: {
              inquiry: {
                include: {
                  customer: { select: { id: true, name: true } }
                }
              }
            }
          },
          calculatedBy: { select: { id: true, name: true, email: true } }
        }
      })

      // Update the inquiry item status
      await tx.inquiryItem.update({
        where: { id: inquiryItemId },
        data: { status: 'COSTED' }
      })

      // Update inquiry status if all items are costed
      const inquiryItems = await tx.inquiryItem.findMany({
        where: { inquiryId: inquiryItem.inquiry.id },
        select: { status: true }
      })

      const allCosted = inquiryItems.every(item => 
        ['COSTED', 'APPROVED', 'QUOTED'].includes(item.status)
      )

      if (allCosted) {
        await tx.inquiry.update({
          where: { id: inquiryItem.inquiry.id },
          data: { status: 'COSTING' }
        })
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'CostCalculation',
          entityId: costCalculation.id,
          oldData: {},
          newData: {
            materialCost: costCalculation.materialCost,
            laborCost: costCalculation.laborCost,
            overheadCost: costCalculation.overheadCost,
            totalCost: costCalculation.totalCost,
            inquiryItemId: inquiryItemId,
          },
          metadata: {},
          userId: user.id,
          inquiryId: inquiryItem.inquiry.id,
        }
      })

      // Create notification for managers (approval needed)
      const managers = await tx.user.findMany({
        where: { role: 'MANAGER', isActive: true },
        select: { id: true, name: true, email: true }
      })

      for (const manager of managers) {
        await tx.notification.create({
          data: {
            type: 'APPROVAL_REQUIRED',
            title: 'Cost calculation needs approval',
            message: `Cost calculation for "${inquiryItem.name}" in inquiry "${inquiryItem.inquiry.title}" requires your approval`,
            userId: manager.id,
            isRead: false,
            readAt: null,
            data: {
              costCalculationId: costCalculation.id,
              inquiryItemId: inquiryItemId,
              inquiryId: inquiryItem.inquiry.id,
              totalCost: totalCost
            }
          }
        })
      }

      // Send email notifications to managers
      if (managers.length > 0) {
        try {
          await sendNotificationEmail(
            'approval_required',
            managers.map(m => m.email),
            {
              managerName: managers.map(m => m.name).join(', '), // For multiple managers
              itemName: inquiryItem.name,
              vpName: user.name,
              totalCost: totalCost,
              inquiryTitle: inquiryItem.inquiry.title
            }
          )
        } catch (emailError) {
          console.error('Failed to send approval notification email:', emailError)
          // Don't fail the main transaction if email fails
        }
      }

      return costCalculation
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Cost calculation created successfully',
    })
  } catch (error) {
    console.error('Create cost calculation error:', error)
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}