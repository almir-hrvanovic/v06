import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only VPP, ADMIN, and SUPERUSER can unassign items
    const allowedRoles: UserRole[] = ['VPP', 'ADMIN', 'SUPERUSER']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    const { itemIds } = await request.json()

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: itemIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Update items to remove assignment
    const result = await prisma.inquiryItem.updateMany({
      where: {
        id: { in: itemIds },
      },
      data: {
        assignedToId: null,
        status: 'PENDING', // Reset status to pending when unassigned
      },
    })

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      message: `Successfully unassigned ${result.count} item(s)`,
    })
  } catch (error) {
    console.error('Error unassigning items:', error)
    return NextResponse.json(
      { error: 'Failed to unassign items' },
      { status: 500 }
    )
  }
}