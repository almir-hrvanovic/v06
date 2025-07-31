import { NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@gs-cms.com' }
    })

    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin user already exists' })
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const admin = await db.user.create({
      data: {
        email: 'admin@gs-cms.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    })

    return NextResponse.json({ 
      message: 'Admin user created successfully',
      user: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}