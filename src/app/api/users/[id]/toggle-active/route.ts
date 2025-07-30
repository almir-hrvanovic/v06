import { NextRequest, NextResponse } from 'next/server'
// Removed NextAuth import - now using Supabase auth
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPERUSER and ADMIN can toggle user status
    if (session.user.role !== UserRole.SUPERUSER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent toggling own status
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own status' },
        { status: 400 }
      )
    }

    // Toggle active status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'USER',
        entityId: user.id,
        userId: session.user.id!,
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