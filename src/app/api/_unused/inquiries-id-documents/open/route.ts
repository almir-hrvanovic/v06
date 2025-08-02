import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'
import { db } from '@/lib/db/index'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { hasPermission } from '@/utils/supabase/api-auth'

const execAsync = promisify(exec)

export async function POST(
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

    // Check permissions: User can open files if they are:
    // 1. The creator of the inquiry
    // 2. Assigned to the inquiry
    // 3. Has ADMIN or SUPERUSER role
    // 4. SALES role (can view all inquiries)
    // 5. VP/VPP if assigned to inquiry items
    const canView = 
      user.id === inquiry.createdById ||
      user.id === inquiry.assignedToId ||
      ['ADMIN', 'SUPERUSER', 'SALES'].includes(user.role) ||
      optimizedAuth.hasPermission(user.role, 'inquiries', 'read')

    // Additional check for VP/VPP - can they view any items in this inquiry?
    if (!canView && ['VP', 'VPP'].includes(user.role)) {
      const hasAssignedItems = await db.inquiryItem.findFirst({
        where: {
          inquiryId: params.id,
          assignedToId: user.id
        }
      })
      if (!hasAssignedItems) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the file path from request body
    const { filePath } = await request.json()
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Get system settings for storage
    const settings = await db.systemSettings.findFirst()
    
    if (!settings || settings.storageProvider !== 'LOCAL') {
      return NextResponse.json({ 
        error: 'File opening is only available with local storage' 
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

    // Platform-specific command to open file with default application
    let command: string
    const platform = process.platform
    
    if (platform === 'darwin') {
      // macOS
      command = `open "${normalizedPath}"`
    } else if (platform === 'win32') {
      // Windows
      command = `start "" "${normalizedPath}"`
    } else {
      // Linux and others
      command = `xdg-open "${normalizedPath}"`
    }

    // Execute the command
    try {
      await execAsync(command)
      return NextResponse.json({ 
        success: true,
        message: 'File opened successfully',
        path: filePath
      })
    } catch (error) {
      console.error('Failed to open file:', error)
      // If opening fails, provide download as fallback
      return NextResponse.json({ 
        success: false,
        message: 'Could not open file with system application. Please download instead.',
        fallbackAction: 'download'
      }, { status: 200 }) // Return 200 with fallback action
    }
  } catch (error) {
    console.error('Open file error:', error)
    return NextResponse.json(
      { error: 'Failed to open file' },
      { status: 500 }
    )
  }
}