import { NextRequest, NextResponse } from 'next/server'
// Removed NextAuth import - now using Supabase auth
import { db } from '@/lib/db/index'
import { UserRole } from '@/lib/db/types'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPERUSER and ADMIN can toggle user status
    if (user.role !== UserRole.SUPERUSER && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent toggling own status
    if (user.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own status' },
        { status: 400 }
      )
    }

    // Toggle active status
    const updatedUser = await db.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'USER',
        entityId: user.id,
        userId: user.id!,
        oldData: { isActive: user.isActive },
        newData: { isActive: updatedUser.isActive },
        metadata: {
          userName: user.name,
          action: updatedUser.isActive ? 'activated' : 'deactivated'
        }
      }
    })

    return NextResponse.json({
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser
    })
  } catch (error) {
    console.error('Failed to toggle user status:', error)
    return NextResponse.json(
      { error: 'Failed to toggle user status' },
      { status: 500 }
    )
  }
}