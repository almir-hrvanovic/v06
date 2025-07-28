import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Schema for linking attachments to inquiries/items
const linkAttachmentSchema = z.object({
  fileId: z.string(),
  inquiryId: z.string().optional(),
  itemId: z.string().optional(),
}).refine(data => data.inquiryId || data.itemId, {
  message: "Either inquiryId or itemId must be provided"
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = linkAttachmentSchema.parse(body)

    // Verify the file exists and belongs to the user or they have permission
    const fileAttachment = await prisma.fileAttachment.findUnique({
      where: { id: validatedData.fileId },
      include: {
        uploadedBy: { select: { id: true, name: true } }
      }
    })

    if (!fileAttachment) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Create the appropriate link
    if (validatedData.inquiryId) {
      // Verify user has access to the inquiry
      const inquiry = await prisma.inquiry.findUnique({
        where: { id: validatedData.inquiryId },
        select: { id: true, createdById: true, assignedToId: true }
      })

      if (!inquiry) {
        return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
      }

      // Check permissions - user must be creator, assignee, or admin
      const hasPermission = 
        inquiry.createdById === session.user.id ||
        inquiry.assignedToId === session.user.id ||
        ['ADMIN', 'SUPERUSER', 'MANAGER'].includes(session.user.role)

      if (!hasPermission) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      // Create inquiry attachment link
      const inquiryAttachment = await prisma.inquiryAttachment.create({
        data: {
          inquiryId: validatedData.inquiryId,
          attachmentId: validatedData.fileId,
        },
        include: {
          attachment: true,
          inquiry: { 
            select: { id: true, title: true }
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: inquiryAttachment,
        message: 'File attached to inquiry successfully'
      })
    }

    if (validatedData.itemId) {
      // Verify user has access to the inquiry item
      const item = await prisma.inquiryItem.findUnique({
        where: { id: validatedData.itemId },
        include: {
          inquiry: { select: { id: true, createdById: true, assignedToId: true } },
          assignedTo: { select: { id: true } }
        }
      })

      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      }

      // Check permissions
      const hasPermission = 
        item.inquiry.createdById === session.user.id ||
        item.inquiry.assignedToId === session.user.id ||
        item.assignedToId === session.user.id ||
        ['ADMIN', 'SUPERUSER', 'MANAGER'].includes(session.user.role)

      if (!hasPermission) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      // Create item attachment link
      const itemAttachment = await prisma.itemAttachment.create({
        data: {
          itemId: validatedData.itemId,
          attachmentId: validatedData.fileId,
        },
        include: {
          attachment: true,
          item: { 
            select: { id: true, name: true }
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: itemAttachment,
        message: 'File attached to item successfully'
      })
    }

  } catch (error) {
    console.error('Link attachment error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const inquiryId = searchParams.get('inquiryId')
    const itemId = searchParams.get('itemId')

    if (inquiryId) {
      // Get inquiry attachments
      const attachments = await prisma.inquiryAttachment.findMany({
        where: { inquiryId },
        include: {
          attachment: {
            include: {
              uploadedBy: { select: { id: true, name: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({
        success: true,
        data: attachments
      })
    }

    if (itemId) {
      // Get item attachments
      const attachments = await prisma.itemAttachment.findMany({
        where: { itemId },
        include: {
          attachment: {
            include: {
              uploadedBy: { select: { id: true, name: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({
        success: true,
        data: attachments
      })
    }

    // Get all user's uploaded files
    const attachments = await prisma.fileAttachment.findMany({
      where: { uploadedById: session.user.id },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        inquiryAttachments: {
          include: {
            inquiry: { select: { id: true, title: true } }
          }
        },
        itemAttachments: {
          include: {
            item: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: attachments
    })

  } catch (error) {
    console.error('Get attachments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('attachmentId')
    const inquiryId = searchParams.get('inquiryId')
    const itemId = searchParams.get('itemId')

    if (!attachmentId) {
      return NextResponse.json({ error: 'Attachment ID required' }, { status: 400 })
    }

    if (inquiryId) {
      // Remove inquiry attachment link
      await prisma.inquiryAttachment.deleteMany({
        where: {
          inquiryId,
          attachmentId
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Attachment removed from inquiry'
      })
    }

    if (itemId) {
      // Remove item attachment link
      await prisma.itemAttachment.deleteMany({
        where: {
          itemId,
          attachmentId
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Attachment removed from item'
      })
    }

    return NextResponse.json({ error: 'Either inquiryId or itemId required' }, { status: 400 })

  } catch (error) {
    console.error('Delete attachment link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}