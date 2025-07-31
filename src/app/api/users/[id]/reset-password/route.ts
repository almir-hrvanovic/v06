import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { hasPermission } from '@/utils/supabase/api-auth'
import bcrypt from 'bcryptjs'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!hasPermission(user.role, 'users', 'write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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

    // Generate a new temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Update user's password
    await db.user.update({
      where: { id },
      data: { password: hashedPassword }
    })

    // Create audit log (if session user exists in database)
    const sessionUser = await db.user.findUnique({
      where: { id: user.id! }
    })
    
    if (sessionUser) {
      await db.auditLog.create({
        data: {
          action: 'RESET_PASSWORD',
          entity: 'USER',
          entityId: existingUser.id,
          userId: user.id!,
          metadata: {
            resetBy: user.email
          }
        }
      })
    }

    return NextResponse.json({
      message: 'Password reset successfully',
      tempPassword // In production, don't return this - send via email instead
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}