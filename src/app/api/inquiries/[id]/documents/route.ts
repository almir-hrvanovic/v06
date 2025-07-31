import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import path from 'path'
import fs from 'fs/promises'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

// Schema for document upload
const uploadDocumentsSchema = z.object({
  files: z.array(z.object({
    name: z.string(),
    url: z.string(),
    size: z.number(),
    type: z.string(),
  }))
})

// Ensure directory exists
async function ensureDirectory(dirPath: string) {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

// Create inquiry folder structure
async function createInquiryFolders(inquiryId: string, basePath: string) {
  const inquiryDir = path.join(basePath, inquiryId)
  const customerDocsDir = path.join(inquiryDir, 'customer-documents')
  
  await ensureDirectory(inquiryDir)
  await ensureDirectory(customerDocsDir)
  
  return { inquiryDir, customerDocsDir }
}

// POST - Create folder structure and save document references
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: inquiryId } = await params

    // Verify inquiry exists and user has access
    const inquiry = await db.inquiry.findUnique({
      where: { id: inquiryId },
      select: { 
        id: true, 
        createdById: true, 
        assignedToId: true,
        title: true 
      }
    })

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // Check permissions
    const hasPermission = 
      inquiry.createdById === user.id ||
      inquiry.assignedToId === user.id ||
      ['ADMIN', 'SUPERUSER', 'MANAGER'].includes(user.role)

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get storage settings
    const settings = await db.systemSettings.findFirst()
    const basePath = settings?.storageProvider === 'LOCAL' 
      ? (settings.localStoragePath || './uploads')
      : path.join(process.cwd(), 'inquiry-documents')

    // Create folder structure
    const { inquiryDir, customerDocsDir } = await createInquiryFolders(inquiryId, basePath)

    // Parse request body
    const body = await request.json()
    const { files } = uploadDocumentsSchema.parse(body)

    // Save file references to database and link to inquiry
    const savedFiles = []
    for (const file of files) {
      // Save file reference
      const fileAttachment = await db.fileAttachment.create({
        data: {
          fileName: file.name,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadThingKey: '', // Will be updated when file is moved
          uploadThingUrl: file.url,
          uploadedById: user.id,
          folderPath: customerDocsDir,
        }
      })

      // Link to inquiry
      await db.inquiryAttachment.create({
        data: {
          inquiryId: inquiryId,
          attachmentId: fileAttachment.id,
        }
      })

      savedFiles.push(fileAttachment)
    }

    // Create metadata file
    const metadataPath = path.join(inquiryDir, 'metadata.json')
    const metadata = {
      inquiryId,
      inquiryTitle: inquiry.title,
      createdAt: new Date().toISOString(),
      createdBy: user.name || user.email,
      folders: {
        'customer-documents': {
          description: 'Documents uploaded by customer',
          fileCount: files.length
        }
      }
    }
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        inquiryId,
        folderPath: customerDocsDir,
        files: savedFiles,
      }
    })

  } catch (error) {
    console.error('Document upload error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get folder path for opening
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: inquiryId } = await params

    // Verify inquiry exists and user has access
    const inquiry = await db.inquiry.findUnique({
      where: { id: inquiryId },
      select: { 
        id: true, 
        createdById: true, 
        assignedToId: true 
      }
    })

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // Check permissions
    const hasPermission = 
      inquiry.createdById === user.id ||
      inquiry.assignedToId === user.id ||
      ['ADMIN', 'SUPERUSER', 'MANAGER'].includes(user.role)

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get storage settings
    const settings = await db.systemSettings.findFirst()
    const basePath = settings?.storageProvider === 'LOCAL' 
      ? (settings.localStoragePath || './uploads')
      : path.join(process.cwd(), 'inquiry-documents')
      
    const customerDocsDir = path.join(basePath, inquiryId, 'customer-documents')
    
    // Check if folder exists
    try {
      await fs.access(customerDocsDir)
      
      // Get file count
      const files = await fs.readdir(customerDocsDir)
      
      return NextResponse.json({
        success: true,
        data: {
          folderPath: customerDocsDir,
          fileCount: files.length,
          exists: true
        }
      })
    } catch {
      return NextResponse.json({
        success: true,
        data: {
          folderPath: customerDocsDir,
          fileCount: 0,
          exists: false
        }
      })
    }

  } catch (error) {
    console.error('Get folder error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}