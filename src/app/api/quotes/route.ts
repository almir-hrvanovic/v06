import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { UserRole } from '@/lib/db/types'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only certain roles can view quotes
    if (user.role !== UserRole.SUPERUSER && 
        user.role !== UserRole.ADMIN && 
        user.role !== UserRole.MANAGER && 
        user.role !== UserRole.SALES) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const where: any = {}
    
    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { inquiry: { title: { contains: search, mode: 'insensitive' } } },
        { inquiry: { customer: { name: { contains: search, mode: 'insensitive' } } } }
      ]
    }

    if (status) {
      where.status = status
    }

    const quotes = await db.quote.findMany({
      where,
      include: {
        inquiry: {
          include: {
            customer: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(quotes)
  } catch (error) {
    console.error('Failed to fetch quotes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  }
}