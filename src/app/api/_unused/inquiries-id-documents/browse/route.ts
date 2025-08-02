import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'
import { db } from '@/lib/db/index'
import * as fs from 'fs/promises'
import * as path from 'path'
import { hasPermission } from '@/utils/supabase/api-auth'

interface FileInfo {
  name: string
  path: string
  size: number
  type: string
  mimeType?: string
  createdAt: string
  updatedAt: string
  isDirectory: boolean
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view inquiry documents
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

    // Check permissions: User can view if they are:
    // 1. The creator of the inquiry
    // 2. Assigned to the inquiry
    // 3. Has ADMIN or SUPERUSER role
    // 4. SALES role (can view all inquiries)
    const canView = 
      user.id === inquiry.createdById ||
      user.id === inquiry.assignedToId ||
      ['ADMIN', 'SUPERUSER', 'SALES'].includes(user.role) ||
      optimizedAuth.hasPermission(user.role, 'inquiries', 'read')

    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get system settings for storage
    const settings = await db.systemSettings.findFirst()
    
    if (!settings || settings.storageProvider !== 'LOCAL') {
      return NextResponse.json({ 
        error: 'Folder browsing is only available with local storage' 
      }, { status: 400 })
    }

    // Build folder path
    const storagePath = settings.localStoragePath || './uploads'
    const inquiryFolder = path.join(process.cwd(), storagePath, 'inquiries', params.id)
    
    // Get relative path from query
    const { searchParams } = new URL(request.url)
    const relativePath = searchParams.get('path') || ''
    
    // Ensure the path doesn't escape the inquiry folder (security)
    const fullPath = path.join(inquiryFolder, relativePath)
    const normalizedPath = path.normalize(fullPath)
    
    if (!normalizedPath.startsWith(path.normalize(inquiryFolder))) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // Check if folder exists
    try {
      await fs.access(normalizedPath)
    } catch {
      return NextResponse.json({ 
        exists: false,
        files: [],
        path: relativePath
      })
    }

    // Read directory contents
    const entries = await fs.readdir(normalizedPath, { withFileTypes: true })
    
    // Get file information
    const files: FileInfo[] = await Promise.all(
      entries.map(async (entry) => {
        const filePath = path.join(normalizedPath, entry.name)
        const stats = await fs.stat(filePath)
        const relativePath = path.relative(inquiryFolder, filePath)
        
        return {
          name: entry.name,
          path: relativePath,
          size: stats.size,
          type: entry.isDirectory() ? 'directory' : path.extname(entry.name).slice(1),
          mimeType: getMimeType(entry.name),
          createdAt: stats.birthtime.toISOString(),
          updatedAt: stats.mtime.toISOString(),
          isDirectory: entry.isDirectory()
        }
      })
    )

    // Sort: directories first, then by name
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({
      exists: true,
      files,
      path: relativePath,
      totalFiles: files.filter(f => !f.isDirectory).length,
      totalFolders: files.filter(f => f.isDirectory).length
    })
  } catch (error) {
    console.error('Browse folder error:', error)
    return NextResponse.json(
      { error: 'Failed to browse folder' },
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