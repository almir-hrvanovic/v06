import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { createApprovalSchema } from '@/lib/validations'
import { canApprove } from '@/utils/supabase/api-auth'
import { sendNotificationEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canApprove(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: any = {}

    // Apply role-based filtering
    if (session.user.role === 'MANAGER') {
      // Managers can see all approvals they need to handle
      where.OR = [
        { approverId: session.user.id },
        { status: 'PENDING' } // Show pending approvals that need assignment
      ]
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    const approvals = await prisma.approval.findMany({
      where,
      include: {
        approver: { select: { id: true, name: true, email: true } },
        costCalculation: {
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
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: approvals,
    })
  } catch (error) {
    console.error('Get approvals error:', error)
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

    if (!canApprove(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createApprovalSchema.parse(body)

    // Verify the cost calculation exists
    const costCalculation = await prisma.costCalculation.findUnique({
      where: { id: validatedData.costCalculationId },
      include: {
        inquiryItem: {
          include: {
            inquiry: { 
              select: { 
                id: true, 
                title: true,
                customer: { select: { name: true } }
              } 
            }
          }
        },
        calculatedBy: { select: { id: true, name: true, email: true } },
        approvals: { select: { id: true, status: true } }
      }
    })

    if (!costCalculation) {
      return NextResponse.json(
        { error: 'Cost calculation not found' },
        { status: 404 }
      )
    }

    // Check if there's already an active approval
    const existingApproval = costCalculation.approvals.find(a => 
      a.status === 'PENDING' || a.status === 'APPROVED'
    )

    if (existingApproval) {
      return NextResponse.json(
        { error: 'Cost calculation already has an active approval' },
        { status: 400 }
      )
    }

    // Create approval in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the approval
      const approval = await tx.approval.create({
        data: {
          type: 'COST_CALCULATION',
          status: validatedData.status,
          comments: validatedData.comments,
          approverId: session.user.id,
          costCalculationId: validatedData.costCalculationId,
          ...(validatedData.status === 'APPROVED' && { approvedAt: new Date() })
        },
        include: {
          approver: { select: { id: true, name: true, email: true } },
          costCalculation: {
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
          }
        }
      })

      // Update cost calculation if approved
      if (validatedData.status === 'APPROVED') {
        await tx.costCalculation.update({
          where: { id: validatedData.costCalculationId },
          data: {
            isApproved: true,
            approvedAt: new Date()
          }
        })

        // Update inquiry item status
        await tx.inquiryItem.update({
          where: { id: costCalculation.inquiryItem.id },
          data: { status: 'APPROVED' }
        })

        // Check if all items in the inquiry are approved
        const inquiryItems = await tx.inquiryItem.findMany({
          where: { inquiryId: costCalculation.inquiryItem.inquiry.id },
          include: { costCalculation: true }
        })

        const allApproved = inquiryItems.every(item => 
          item.costCalculation?.isApproved || ['APPROVED', 'QUOTED'].includes(item.status)
        )

        if (allApproved) {
          await tx.inquiry.update({
            where: { id: costCalculation.inquiryItem.inquiry.id },
            data: { status: 'COSTING' } // Ready for quote generation
          })

          // Notify sales team
          const salesUsers = await tx.user.findMany({
            where: { role: 'SALES', isActive: true },
            select: { id: true, name: true, email: true }
          })

          for (const salesUser of salesUsers) {
            await tx.notification.create({
              data: {
                type: 'QUOTE_GENERATED',
                title: 'Inquiry ready for quote generation',
                message: `All cost calculations for "${costCalculation.inquiryItem.inquiry.title}" have been approved. You can now generate a quote.`,
                userId: salesUser.id,
                data: {
                  inquiryId: costCalculation.inquiryItem.inquiry.id,
                  inquiryTitle: costCalculation.inquiryItem.inquiry.title
                }
              }
            })
          }

          // Send email notifications to sales team about quote readiness
          if (salesUsers.length > 0) {
            try {
              await sendNotificationEmail(
                'quote_ready',
                salesUsers.map(s => s.email),
                {
                  salesPersonName: salesUsers.map(s => s.name).join(', '),
                  inquiryTitle: costCalculation.inquiryItem.inquiry.title,
                  customerName: costCalculation.inquiryItem.inquiry.customer.name,
                  itemCount: inquiryItems.length
                }
              )
            } catch (emailError) {
              console.error('Failed to send quote ready email:', emailError)
            }
          }
        }

        // Notify the VP who calculated the costs
        await tx.notification.create({
          data: {
            type: 'STATUS_UPDATE',
            title: 'Cost calculation approved',
            message: `Your cost calculation for "${costCalculation.inquiryItem.name}" has been approved by ${session.user.name}`,
            userId: costCalculation.calculatedBy.id,
            data: {
              costCalculationId: costCalculation.id,
              inquiryItemId: costCalculation.inquiryItem.id,
              approvalStatus: 'APPROVED'
            }
          }
        })

        // Send email notification to VP
        try {
          await sendNotificationEmail(
            'approval_status',
            [costCalculation.calculatedBy.email],
            {
              vpName: costCalculation.calculatedBy.name,
              itemName: costCalculation.inquiryItem.name,
              status: 'approved' as const,
              managerName: session.user.name,
              comments: validatedData.comments
            }
          )
        } catch (emailError) {
          console.error('Failed to send approval status email:', emailError)
        }
      } else if (validatedData.status === 'REJECTED') {
        // Update inquiry item status back to assigned for recalculation
        await tx.inquiryItem.update({
          where: { id: costCalculation.inquiryItem.id },
          data: { status: 'ASSIGNED' }
        })

        // Notify the VP about rejection
        await tx.notification.create({
          data: {
            type: 'STATUS_UPDATE',
            title: 'Cost calculation rejected',
            message: `Your cost calculation for "${costCalculation.inquiryItem.name}" has been rejected. Please review and recalculate.`,
            userId: costCalculation.calculatedBy.id,
            data: {
              costCalculationId: costCalculation.id,
              inquiryItemId: costCalculation.inquiryItem.id,
              approvalStatus: 'REJECTED',
              comments: validatedData.comments
            }
          }
        })

        // Send email notification to VP about rejection
        try {
          await sendNotificationEmail(
            'approval_status',
            [costCalculation.calculatedBy.email],
            {
              vpName: costCalculation.calculatedBy.name,
              itemName: costCalculation.inquiryItem.name,
              status: 'rejected' as const,
              managerName: session.user.name,
              comments: validatedData.comments
            }
          )
        } catch (emailError) {
          console.error('Failed to send rejection status email:', emailError)
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: validatedData.status === 'APPROVED' ? 'APPROVE' : 'REJECT',
          entity: 'CostCalculation',
          entityId: costCalculation.id,
          newData: {
            approvalStatus: validatedData.status,
            approvedBy: session.user.name,
            comments: validatedData.comments
          },
          userId: session.user.id,
          inquiryId: costCalculation.inquiryItem.inquiry.id,
        }
      })

      return approval
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: `Cost calculation ${validatedData.status.toLowerCase()} successfully`,
    })
  } catch (error) {
    console.error('Create approval error:', error)
    
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