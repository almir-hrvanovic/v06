import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { UserRole } from '@/lib/db/types'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { apiAuth } from '@/utils/api/optimized-auth-wrapper'
import { optimizeApiRoute } from '@/lib/api-optimization'

const getHandler = apiAuth.withPermission('users', 'read', async (request: NextRequest, user: any) => {
  try {
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
        updatedAt: true,
        preferredLanguage: true
      },
      orderBy: { name: 'asc' }
    })

    return {
      success: true,
      data: users,
      total: users.length,
      pagination: {
        page: 1,
        limit: users.length,
        total: users.length
      }
    }
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Schema for creating users
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.nativeEnum(UserRole)
})

const postHandler = apiAuth.withPermission('users', 'write', async (request: NextRequest, user: any) => {
  try {
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

    return {
      success: true,
      data: {
        ...newUser,
        tempPassword
      },
      message: 'User created successfully'
    }
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
})

// Export optimized route handlers
export const GET = optimizeApiRoute(getHandler, {
  enableCaching: true,
  cacheMaxAge: 180, // 3 minutes cache for users (they change frequently)
  enableCompression: true,
  enableETag: true,
  optimizePayload: true,
  excludeFields: ['password'] // Always exclude password field
})

export const POST = optimizeApiRoute(postHandler, {
  enableCaching: false, // Don't cache POST requests
  enableCompression: true,
  enableResponseTiming: true,
  optimizePayload: true,
  excludeFields: ['password'] // Always exclude password field
})