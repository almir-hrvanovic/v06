import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    console.log('[LocalUpload] Upload request received')
    
    const user = await getAuthenticatedUser()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get system settings
    const settings = await db.systemSettings.findFirst()
    
    if (!settings || settings.storageProvider !== 'LOCAL') {
      return NextResponse.json(
        { error: 'Local storage is not configured' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const inquiryId = formData.get('inquiryId') as string | null
    
    const uploadedFiles = []
    const basePath = settings.localStoragePath || './uploads'
    
    // Process each file
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file') && value instanceof File) {
        const file = value
        
        console.log(`[LocalUpload] Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`)
        
        // Validate file size
        if (file.size > settings.maxFileSize) {
          return NextResponse.json(
            { error: `File ${file.name} exceeds maximum size limit of ${settings.maxFileSize / 1048576}MB` },
            { status: 400 }
          )
        }

        // Validate file type
        const isAllowed = settings.allowedFileTypes.some((type: string) => {
          if (type.endsWith('/*')) {
            const baseType = type.replace('/*', '')
            return file.type.startsWith(baseType)
          }
          return file.type === type
        })

        if (!isAllowed) {
          return NextResponse.json(
            { error: `File type ${file.type} is not allowed` },
            { status: 400 }
          )
        }

        // Generate unique file name
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(7)
        const extension = file.name.split('.').pop()
        const fileName = `${timestamp}-${randomString}.${extension}`
        
        // Determine folder path
        let folderPath = ''
        if (inquiryId) {
          folderPath = join(inquiryId, 'customer-documents')
        }
        
        // Full path
        const relativePath = folderPath ? join(folderPath, fileName) : fileName
        const fullPath = join(basePath, relativePath)
        
        console.log(`[LocalUpload] Saving to: ${fullPath}`)
        
        // Ensure directory exists
        const dir = dirname(fullPath)
        if (!existsSync(dir)) {
          await mkdir(dir, { recursive: true })
          console.log(`[LocalUpload] Created directory: ${dir}`)
        }
        
        // Convert file to buffer and write
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(fullPath, buffer)
        
        console.log(`[LocalUpload] File saved successfully`)
        
        // Create database record
        const attachment = await db.fileAttachment.create({
          data: {
            fileName,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadThingUrl: `/api/files/${encodeURIComponent(relativePath)}`,
            uploadThingKey: relativePath,
            uploadedById: user.id,
            folderPath: folderPath || null
          }
        })
        
        // If inquiry ID is provided, link to inquiry
        if (inquiryId) {
          const inquiry = await db.inquiry.findUnique({
            where: { id: inquiryId }
          })
          
          if (inquiry) {
            await db.inquiryAttachment.create({
              data: {
                inquiryId: inquiryId,
                attachmentId: attachment.id,
              }
            })
          }
        }
        
        uploadedFiles.push({
          fileId: attachment.id,
          fileName: attachment.fileName,
          fileUrl: attachment.uploadThingUrl,
          uploadedBy: user.id
        })
      }
    }

    console.log(`[LocalUpload] Upload complete. ${uploadedFiles.length} files uploaded`)

    return NextResponse.json({
      success: true,
      files: uploadedFiles
    })
    
  } catch (error: any) {
    console.error('[LocalUpload] Upload error:', error)
    console.error('[LocalUpload] Error stack:', error.stack)
    
    return NextResponse.json(
      { error: 'Failed to upload files', details: error.message },
      { status: 500 }
    )
  }
}