import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/auth'
import bcrypt from 'bcryptjs'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  
  try {
    const session = await getServerAuth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!hasPermission(session.user.role, 'users', 'write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
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
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    })

    // Create audit log (if session user exists in database)
    const sessionUser = await prisma.user.findUnique({
      where: { id: session.user.id! }
    })
    
    if (sessionUser) {
      await prisma.auditLog.create({
        data: {
          action: 'RESET_PASSWORD',
          entity: 'USER',
          entityId: existingUser.id,
          userId: session.user.id!,
          metadata: {
            resetBy: session.user.email
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