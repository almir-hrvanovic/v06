import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'
import { db } from '@/lib/db/index'
import * as fs from 'fs'
import * as path from 'path'
import { hasPermission } from '@/utils/supabase/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to download inquiry documents
    const inquiry = await db.inquiry.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        assignedTo: true,
        createdBy: true
      }
    })

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // Check permissions: User can download if they are:
    // 1. The creator of the inquiry
    // 2. Assigned to the inquiry
    // 3. Has ADMIN or SUPERUSER role
    // 4. SALES role (can view all inquiries)
    // 5. VP/VPP if assigned to inquiry items
    const canDownload = 
      user.id === inquiry.createdById ||
      user.id === inquiry.assignedToId ||
      ['ADMIN', 'SUPERUSER', 'SALES'].includes(user.role) ||
      hasPermission(user.role, 'inquiries', 'read')

    // Additional check for VP/VPP - can they view any items in this inquiry?
    if (!canDownload && ['VP', 'VPP'].includes(user.role)) {
      const hasAssignedItems = await db.inquiryItem.findFirst({
        where: {
          inquiryId: params.id,
          assignedToId: user.id
        }
      })
      if (!hasAssignedItems) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (!canDownload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the file path from query
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Get system settings for storage
    const settings = await db.systemSettings.findFirst()
    
    if (!settings || settings.storageProvider !== 'LOCAL') {
      return NextResponse.json({ 
        error: 'File download is only available with local storage' 
      }, { status: 400 })
    }

    // Build full file path
    const storagePath = settings.localStoragePath || './uploads'
    const inquiryFolder = path.join(process.cwd(), storagePath, 'inquiries', params.id)
    const fullPath = path.join(inquiryFolder, filePath)
    const normalizedPath = path.normalize(fullPath)
    
    // Security check: ensure the path doesn't escape the inquiry folder
    if (!normalizedPath.startsWith(path.normalize(inquiryFolder))) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if it's a file (not a directory)
    const stats = fs.statSync(normalizedPath)
    if (stats.isDirectory()) {
      return NextResponse.json({ error: 'Cannot download a directory' }, { status: 400 })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(normalizedPath)
    const fileName = path.basename(normalizedPath)
    const mimeType = getMimeType(fileName)

    // Return file as response
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Download file error:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: { [key: string]: string } = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.zip': 'application/zip',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.xml': 'application/xml',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}