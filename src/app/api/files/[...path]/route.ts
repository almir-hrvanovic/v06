import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { lookup } from 'mime-types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { path } = await params
    const filePath = path.join('/')
    
    // Get storage settings
    const settings = await db.systemSettings.findFirst()
    
    if (!settings || settings.storageProvider !== 'LOCAL') {
      return NextResponse.json(
        { error: 'Local storage not configured' },
        { status: 404 }
      )
    }

    // Verify file exists in database
    const fileRecord = await db.fileAttachment.findFirst({
      where: {
        uploadThingKey: filePath
      }
    })

    if (!fileRecord) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Construct full path
    const basePath = settings.localStoragePath || './uploads'
    const fullPath = join(basePath, filePath)

    // Security check - prevent directory traversal
    if (fullPath.includes('..') || !fullPath.startsWith(basePath)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      )
    }

    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'File not found on disk' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await readFile(fullPath)
    
    // Determine content type
    const contentType = lookup(filePath) || 'application/octet-stream'

    // Return file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileRecord.originalName}"`,
        'Content-Length': fileBuffer.length.toString(),
      }
    })
  } catch (error) {
    console.error('Failed to serve file:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}