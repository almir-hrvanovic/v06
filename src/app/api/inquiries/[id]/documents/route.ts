import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import path from 'path'
import fs from 'fs/promises'
import { z } from 'zod'

// Base directory for storing inquiry documents
const DOCUMENTS_BASE_DIR = process.env.DOCUMENTS_DIR || path.join(process.cwd(), 'inquiry-documents')

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
async function createInquiryFolders(inquiryId: string) {
  const inquiryDir = path.join(DOCUMENTS_BASE_DIR, inquiryId)
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
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: inquiryId } = await params

    // Verify inquiry exists and user has access
    const inquiry = await prisma.inquiry.findUnique({
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
      inquiry.createdById === session.user.id ||
      inquiry.assignedToId === session.user.id ||
      ['ADMIN', 'SUPERUSER', 'MANAGER'].includes(session.user.role)

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create folder structure
    const { inquiryDir, customerDocsDir } = await createInquiryFolders(inquiryId)

    // Parse request body
    const body = await request.json()
    const { files } = uploadDocumentsSchema.parse(body)

    // Save file references to database and link to inquiry
    const savedFiles = []
    for (const file of files) {
      // Save file reference
      const fileAttachment = await prisma.fileAttachment.create({
        data: {
          fileName: file.name,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadThingKey: '', // Will be updated when file is moved
          uploadThingUrl: file.url,
          uploadedById: session.user.id,
          folderPath: customerDocsDir,
        }
      })

      // Link to inquiry
      await prisma.inquiryAttachment.create({
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
      createdBy: session.user.name || session.user.email,
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
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: inquiryId } = await params

    // Verify inquiry exists and user has access
    const inquiry = await prisma.inquiry.findUnique({
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
      inquiry.createdById === session.user.id ||
      inquiry.assignedToId === session.user.id ||
      ['ADMIN', 'SUPERUSER', 'MANAGER'].includes(session.user.role)

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const customerDocsDir = path.join(DOCUMENTS_BASE_DIR, inquiryId, 'customer-documents')
    
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