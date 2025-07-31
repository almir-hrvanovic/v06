import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { UserRole } from '@/lib/db/types'
import { hasPermission } from '@/utils/supabase/api-auth'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

// Schema for updating users
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getAuthenticatedUser()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!hasPermission(user.role, 'users', 'write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent changing own role
    if (existingUser.id === user.id && validatedData.role) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // Check if email is being changed to one that already exists
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: validatedData.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Update user
    const user = await db.user.update({
      where: { id },
      data: validatedData
    })

    // Create audit log (if session user exists in database)
    const sessionUser = await db.user.findUnique({
      where: { id: user.id! }
    })
    
    if (sessionUser) {
      await db.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'USER',
          entityId: user.id,
          userId: user.id!,
          oldData: existingUser,
          newData: user
        }
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getAuthenticatedUser()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!hasPermission(user.role, 'users', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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

    // Prevent deleting self
    if (user.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Soft delete (deactivate) the user
    await db.user.update({
      where: { id },
      data: { isActive: false }
    })

    // Create audit log (if session user exists in database)
    const sessionUserForDelete = await db.user.findUnique({
      where: { id: user.id! }
    })
    
    if (sessionUserForDelete) {
      await db.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'USER',
          entityId: user.id,
          userId: user.id!,
          oldData: user,
          metadata: {
            action: 'deactivated'
          }
        }
      })
    }

    return NextResponse.json({ message: 'User deactivated' })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}