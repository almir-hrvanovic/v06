import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { z } from 'zod'
import { Currency, StorageProvider } from '@/lib/db/types'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

// Validation schema for system settings
const systemSettingsSchema = z.object({
  mainCurrency: z.nativeEnum(Currency).optional(),
  additionalCurrency1: z.nativeEnum(Currency).optional().nullable(),
  additionalCurrency2: z.nativeEnum(Currency).optional().nullable(),
  exchangeRate1: z.number().positive().optional().nullable(),
  exchangeRate2: z.number().positive().optional().nullable(),
  // Storage settings (optional - only validate if provided)
  storageProvider: z.nativeEnum(StorageProvider).optional(),
  uploadThingToken: z.string().optional().nullable(),
  uploadThingAppId: z.string().optional().nullable(),
  localStoragePath: z.string().optional().nullable(),
  maxFileSize: z.number().min(1048576).max(104857600).optional(), // 1MB to 100MB
  allowedFileTypes: z.array(z.string()).min(1).optional(),
}).refine((data) => {
  // Only validate currency relationships if mainCurrency is being updated
  if (data.mainCurrency !== undefined) {
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
  }
  
  // Storage provider validation - only validate if storage settings are being updated
  if (data.storageProvider !== undefined) {
    if (data.storageProvider === StorageProvider.UPLOADTHING) {
      if (!data.uploadThingToken || !data.uploadThingAppId) {
        return false
      }
    }
    if (data.storageProvider === StorageProvider.LOCAL) {
      if (!data.localStoragePath) {
        return false
      }
    }
  }
  return true
}, {
  message: "Invalid configuration"
})

// GET /api/system-settings
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create system settings
    let settings = await db.systemSettings.findFirst()
    
    if (!settings) {
      // Create default settings if none exist
      settings = await db.systemSettings.create({
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
      // Storage settings
      storageProvider: settings.storageProvider,
      uploadThingToken: settings.uploadThingToken,
      uploadThingAppId: settings.uploadThingAppId,
      localStoragePath: settings.localStoragePath,
      maxFileSize: settings.maxFileSize,
      allowedFileTypes: settings.allowedFileTypes,
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedById ? await db.user.findUnique({
        where: { id: settings.updatedById }
      }).then(user => user ? { name: user.name, email: user.email } : null) : null
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
    console.log('[SystemSettings] PUT request received')
    
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      console.log('[SystemSettings] No user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[SystemSettings] User role:', user.role)
    
    // Only SUPERUSER can update system settings
    if (user.role !== 'SUPERUSER') {
      return NextResponse.json(
        { error: 'Forbidden: Only SUPERUSER can update system settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('[SystemSettings] Request body:', JSON.stringify(body, null, 2))
    
    // Validate input
    const validationResult = systemSettingsSchema.safeParse(body)
    if (!validationResult.success) {
      console.log('[SystemSettings] Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data
    console.log('[SystemSettings] Validated data:', data)

    // Get existing settings
    let settings = await db.systemSettings.findFirst()
    console.log('[SystemSettings] Existing settings:', settings?.id)
    
    if (!settings) {
      // Create if doesn't exist
      settings = await db.systemSettings.create({
        data: {
          mainCurrency: data.mainCurrency || Currency.EUR,
          additionalCurrency1: data.additionalCurrency1,
          additionalCurrency2: data.additionalCurrency2,
          exchangeRate1: data.exchangeRate1,
          exchangeRate2: data.exchangeRate2,
          // Storage settings - use defaults if not provided
          storageProvider: data.storageProvider || StorageProvider.UPLOADTHING,
          uploadThingToken: data.uploadThingToken,
          uploadThingAppId: data.uploadThingAppId,
          localStoragePath: data.localStoragePath || './uploads',
          maxFileSize: data.maxFileSize || 16777216,
          allowedFileTypes: data.allowedFileTypes || ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          updatedById: user.id,
        }
      })
    } else {
      // Update existing - preserve existing storage settings if not provided
      console.log('[SystemSettings] Updating existing settings...')
      try {
        const updateData = {
          // Currency settings - only update if provided
          mainCurrency: data.mainCurrency !== undefined ? data.mainCurrency : settings.mainCurrency,
          additionalCurrency1: data.additionalCurrency1 !== undefined ? data.additionalCurrency1 : settings.additionalCurrency1,
          additionalCurrency2: data.additionalCurrency2 !== undefined ? data.additionalCurrency2 : settings.additionalCurrency2,
          exchangeRate1: data.exchangeRate1 !== undefined ? data.exchangeRate1 : settings.exchangeRate1,
          exchangeRate2: data.exchangeRate2 !== undefined ? data.exchangeRate2 : settings.exchangeRate2,
          // Storage settings - only update if provided
          storageProvider: data.storageProvider !== undefined ? data.storageProvider : settings.storageProvider,
          uploadThingToken: data.uploadThingToken !== undefined ? data.uploadThingToken : settings.uploadThingToken,
          uploadThingAppId: data.uploadThingAppId !== undefined ? data.uploadThingAppId : settings.uploadThingAppId,
          localStoragePath: data.localStoragePath !== undefined ? data.localStoragePath : settings.localStoragePath,
          maxFileSize: data.maxFileSize !== undefined ? data.maxFileSize : settings.maxFileSize,
          allowedFileTypes: data.allowedFileTypes !== undefined ? data.allowedFileTypes : settings.allowedFileTypes,
          updatedById: user.id,
        }
        console.log('[SystemSettings] Update data:', JSON.stringify(updateData, null, 2))
        
        settings = await db.systemSettings.update({
          where: { id: settings.id },
          data: updateData
        })
        console.log('[SystemSettings] Update successful')
      } catch (updateError: any) {
        console.error('[SystemSettings] Update failed:', updateError)
        console.error('[SystemSettings] Update error details:', updateError.message)
        throw updateError
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE_SYSTEM_SETTINGS',
        entity: 'SystemSettings',
        entityId: settings.id,
        userId: user.id,
        metadata: {
          changes: data
        }
      }
    })

    const responseData = {
      id: settings.id,
      mainCurrency: settings.mainCurrency,
      additionalCurrency1: settings.additionalCurrency1,
      additionalCurrency2: settings.additionalCurrency2,
      exchangeRate1: settings.exchangeRate1 ? Number(settings.exchangeRate1) : null,
      exchangeRate2: settings.exchangeRate2 ? Number(settings.exchangeRate2) : null,
      // Storage settings
      storageProvider: settings.storageProvider,
      uploadThingToken: settings.uploadThingToken,
      uploadThingAppId: settings.uploadThingAppId,
      localStoragePath: settings.localStoragePath,
      maxFileSize: settings.maxFileSize,
      allowedFileTypes: settings.allowedFileTypes,
      updatedAt: settings.updatedAt,
      updatedBy: {
        name: user.name || '',
        email: user.email || ''
      }
    }
    
    console.log('[SystemSettings] Response data:', JSON.stringify(responseData, null, 2))
    
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('[SystemSettings] Failed to update system settings:', error)
    console.error('[SystemSettings] Error stack:', error.stack)
    console.error('[SystemSettings] Error type:', error.constructor.name)
    
    // Check for specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate settings record' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update system settings', details: error.message },
      { status: 500 }
    )
  }
}