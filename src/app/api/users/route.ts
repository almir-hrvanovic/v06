import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { UserRole } from '@/lib/db/types'
import { hasPermission } from '@/utils/supabase/api-auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!hasPermission(user.role, 'users', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const roles = searchParams.get('roles')
    const active = searchParams.get('active')
    const search = searchParams.get('search')

    const where: any = {}

    if (roles) {
      // Support comma-separated roles
      const roleArray = roles.split(',').filter(Boolean)
      where.role = { in: roleArray }
    } else if (role) {
      where.role = role
    }

    if (active !== null) {
      where.isActive = active === 'true'
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            createdInquiries: true,
            assignedInquiries: true,
            inquiryItems: true,
            costCalculations: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ data: users, total: users.length })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Schema for creating users
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.nativeEnum(UserRole)
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!hasPermission(user.role, 'users', 'write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user with email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Generate a temporary password (in production, send this via email)
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Create user
    const newUser = await db.user.create({
      data: {
        ...validatedData,
        password: hashedPassword
      }
    })

    // Create audit log (if session user exists in database)
    const sessionUser = await db.user.findUnique({
      where: { id: user.id! }
    })
    
    if (sessionUser) {
      await db.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'USER',
          entityId: newUser.id,
          userId: user.id!,
          newData: {
            userName: newUser.name,
            userEmail: newUser.email,
            userRole: newUser.role
          },
          metadata: {
            createdBy: user.email
          }
        }
      })
    }

    // In production, send email with temporary password
    console.log(`Created user ${newUser.email} with temporary password: ${tempPassword}`)

    return NextResponse.json({
      ...newUser,
      tempPassword // In production, don't return this
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Failed to create user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}