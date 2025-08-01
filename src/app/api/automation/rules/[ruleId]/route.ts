import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { z } from 'zod'
import { UserRole } from '@/lib/db/types'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

// GET /api/automation/rules/[ruleId] - Get single rule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and superusers can view automation rules
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERUSER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { ruleId } = await params

    const rule = await db.automationRule.findUnique({
      where: { id: ruleId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        logs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            executedBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Failed to fetch automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automation rule' },
      { status: 500 }
    )
  }
}

// PATCH /api/automation/rules/[ruleId] - Update rule
const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  trigger: z.enum([
    'INQUIRY_CREATED',
    'INQUIRY_STATUS_CHANGED',
    'ITEM_ASSIGNED',
    'COST_CALCULATED',
    'APPROVAL_REQUIRED',
    'QUOTE_CREATED',
    'DEADLINE_APPROACHING',
    'WORKLOAD_THRESHOLD',
    'PRODUCTION_ORDER_CREATED'
  ]).optional(),
  conditions: z.array(z.any()).optional(),
  actions: z.array(z.any()).optional(),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and superusers can update automation rules
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERUSER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateRuleSchema.parse(body)

    const { ruleId } = await params

    const rule = await db.automationRule.update({
      where: { id: ruleId },
      data,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(rule)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Failed to update automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to update automation rule' },
      { status: 500 }
    )
  }
}

// DELETE /api/automation/rules/[ruleId] - Delete rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superusers can delete automation rules
    if (user.role !== UserRole.SUPERUSER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { ruleId } = await params

    await db.automationRule.delete({
      where: { id: ruleId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete automation rule' },
      { status: 500 }
    )
  }
}