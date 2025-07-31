import { db } from '@/lib/db/index'
import { StorageProvider } from '@/lib/db/types'
import { writeFile, mkdir, unlink, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'

export interface UploadedFile {
  fileId: string
  fileName: string
  fileUrl: string
  uploadedBy: string
}

export interface StorageFile {
  name: string
  size: number
  type: string
  lastModified?: number
  arrayBuffer(): Promise<ArrayBuffer>
  slice(start?: number, end?: number, contentType?: string): Blob
  stream(): ReadableStream
  text(): Promise<string>
}

class StorageProviderFactory {
  private static instance: StorageProviderFactory
  private settings: any = null
  private lastFetch: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): StorageProviderFactory {
    if (!StorageProviderFactory.instance) {
      StorageProviderFactory.instance = new StorageProviderFactory()
    }
    return StorageProviderFactory.instance
  }

  async getSettings() {
    const now = Date.now()
    if (this.settings && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.settings
    }

    this.settings = await db.systemSettings.findFirst()
    this.lastFetch = now
    return this.settings
  }

  async upload(files: File[], userId: string, folderPath?: string): Promise<UploadedFile[]> {
    const settings = await this.getSettings()
    
    if (!settings) {
      throw new Error('Storage settings not configured')
    }

    if (settings.storageProvider === StorageProvider.UPLOADTHING) {
      return this.uploadToUploadThing(files, userId, folderPath)
    } else {
      return this.uploadToLocal(files, userId, folderPath, settings)
    }
  }

  private async uploadToUploadThing(files: File[], userId: string, folderPath?: string): Promise<UploadedFile[]> {
    // This would integrate with the existing UploadThing implementation
    // For now, throw an error indicating it should use the existing UploadThing components
    throw new Error('Please use UploadThing components for cloud storage')
  }

  private async uploadToLocal(files: File[], userId: string, folderPath: string | undefined, settings: any): Promise<UploadedFile[]> {
    const uploadedFiles: UploadedFile[] = []
    const basePath = settings.localStoragePath || './uploads'
    
    for (const file of files) {
      try {
        // Validate file
        if (file.size > settings.maxFileSize) {
          throw new Error(`File ${file.name} exceeds maximum size limit`)
        }

        const isAllowed = settings.allowedFileTypes.some((type: string) => {
          if (type.endsWith('/*')) {
            const baseType = type.replace('/*', '')
            return file.type.startsWith(baseType)
          }
          return file.type === type
        })

        if (!isAllowed) {
          throw new Error(`File type ${file.type} is not allowed`)
        }

        // Generate unique file name
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(7)
        const extension = file.name.split('.').pop()
        const fileName = `${timestamp}-${randomString}.${extension}`
        
        // Determine full path
        const relativePath = folderPath ? join(folderPath, fileName) : fileName
        const fullPath = join(basePath, relativePath)
        
        // Ensure directory exists
        const dir = dirname(fullPath)
        if (!existsSync(dir)) {
          await mkdir(dir, { recursive: true })
        }
        
        // Convert file to buffer and write
        const buffer = Buffer.from(await file.arrayBuffer())
        await writeFile(fullPath, buffer)
        
        // Create database record
        const attachment = await db.fileAttachment.create({
          data: {
            fileName,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadThingUrl: `/api/files/${encodeURIComponent(relativePath)}`,
            uploadThingKey: relativePath,
            uploadedById: userId,
            folderPath: folderPath || null
          }
        })
        
        uploadedFiles.push({
          fileId: attachment.id,
          fileName: attachment.fileName,
          fileUrl: attachment.uploadThingUrl,
          uploadedBy: userId
        })
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error)
        throw error
      }
    }
    
    return uploadedFiles
  }

  async delete(fileKey: string): Promise<void> {
    const settings = await this.getSettings()
    
    if (!settings) {
      throw new Error('Storage settings not configured')
    }

    if (settings.storageProvider === StorageProvider.LOCAL) {
      const basePath = settings.localStoragePath || './uploads'
      const fullPath = join(basePath, fileKey)
      
      if (existsSync(fullPath)) {
        await unlink(fullPath)
      }
    }
    // For UploadThing, deletion would be handled by the UploadThing API
  }

  async getFileUrl(fileKey: string): Promise<string> {
    const settings = await this.getSettings()
    
    if (!settings) {
      throw new Error('Storage settings not configured')
    }

    if (settings.storageProvider === StorageProvider.LOCAL) {
      return `/api/files/${encodeURIComponent(fileKey)}`
    }
    
    // For UploadThing, return the UploadThing URL
    return fileKey
  }
}

export const storageProvider = StorageProviderFactory.getInstance()