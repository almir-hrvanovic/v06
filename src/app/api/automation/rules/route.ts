import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

// GET /api/automation/rules - Get all automation rules
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and superusers can view automation rules
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPERUSER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rules = await prisma.automationRule.findMany({
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { logs: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error('Failed to fetch automation rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automation rules' },
      { status: 500 }
    )
  }
}

// POST /api/automation/rules - Create new automation rule
const createRuleSchema = z.object({
  name: z.string().min(1),
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
  ]),
  conditions: z.array(z.any()),
  actions: z.array(z.any()),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and superusers can create automation rules
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPERUSER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createRuleSchema.parse(body)

    const rule = await prisma.automationRule.create({
      data: {
        ...data,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Failed to create automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to create automation rule' },
      { status: 500 }
    )
  }
}