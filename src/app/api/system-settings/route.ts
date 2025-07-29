import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { Currency } from '@prisma/client'

// Validation schema for system settings
const systemSettingsSchema = z.object({
  mainCurrency: z.nativeEnum(Currency),
  additionalCurrency1: z.nativeEnum(Currency).optional().nullable(),
  additionalCurrency2: z.nativeEnum(Currency).optional().nullable(),
  exchangeRate1: z.number().positive().optional().nullable(),
  exchangeRate2: z.number().positive().optional().nullable(),
}).refine((data) => {
  // If additional currency is set, exchange rate must be provided
  if (data.additionalCurrency1 && !data.exchangeRate1) {
    return false
  }
  if (data.additionalCurrency2 && !data.exchangeRate2) {
    return false
  }
  // Additional currencies must be different from main currency
  if (data.additionalCurrency1 && data.additionalCurrency1 === data.mainCurrency) {
    return false
  }
  if (data.additionalCurrency2 && data.additionalCurrency2 === data.mainCurrency) {
    return false
  }
  // Additional currencies must be different from each other
  if (data.additionalCurrency1 && data.additionalCurrency2 && 
      data.additionalCurrency1 === data.additionalCurrency2) {
    return false
  }
  return true
}, {
  message: "Invalid currency configuration"
})

// GET /api/system-settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create system settings
    let settings = await prisma.systemSettings.findFirst()
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.systemSettings.create({
        data: {
          mainCurrency: Currency.EUR,
        }
      })
    }

    return NextResponse.json({
      id: settings.id,
      mainCurrency: settings.mainCurrency,
      additionalCurrency1: settings.additionalCurrency1,
      additionalCurrency2: settings.additionalCurrency2,
      exchangeRate1: settings.exchangeRate1 ? Number(settings.exchangeRate1) : null,
      exchangeRate2: settings.exchangeRate2 ? Number(settings.exchangeRate2) : null,
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedById ? await prisma.user.findUnique({
        where: { id: settings.updatedById },
        select: { name: true, email: true }
      }) : null
    })
  } catch (error) {
    console.error('Failed to fetch system settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    )
  }
}

// PUT /api/system-settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only SUPERUSER can update system settings
    if (session.user.role !== 'SUPERUSER') {
      return NextResponse.json(
        { error: 'Forbidden: Only SUPERUSER can update system settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = systemSettingsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Get existing settings
    let settings = await prisma.systemSettings.findFirst()
    
    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.systemSettings.create({
        data: {
          mainCurrency: data.mainCurrency,
          additionalCurrency1: data.additionalCurrency1,
          additionalCurrency2: data.additionalCurrency2,
          exchangeRate1: data.exchangeRate1,
          exchangeRate2: data.exchangeRate2,
          updatedById: session.user.id,
        }
      })
    } else {
      // Update existing
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          mainCurrency: data.mainCurrency,
          additionalCurrency1: data.additionalCurrency1,
          additionalCurrency2: data.additionalCurrency2,
          exchangeRate1: data.exchangeRate1,
          exchangeRate2: data.exchangeRate2,
          updatedById: session.user.id,
        }
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_SYSTEM_SETTINGS',
        entity: 'SystemSettings',
        entityId: settings.id,
        userId: session.user.id,
        metadata: {
          changes: data
        }
      }
    })

    return NextResponse.json({
      id: settings.id,
      mainCurrency: settings.mainCurrency,
      additionalCurrency1: settings.additionalCurrency1,
      additionalCurrency2: settings.additionalCurrency2,
      exchangeRate1: settings.exchangeRate1 ? Number(settings.exchangeRate1) : null,
      exchangeRate2: settings.exchangeRate2 ? Number(settings.exchangeRate2) : null,
      updatedAt: settings.updatedAt,
      updatedBy: {
        name: session.user.name,
        email: session.user.email
      }
    })
  } catch (error) {
    console.error('Failed to update system settings:', error)
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    )
  }
}