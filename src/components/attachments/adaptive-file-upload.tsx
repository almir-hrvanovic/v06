"use client"

import { useState, useEffect } from 'react'
import { FileUpload } from './file-upload'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FileIcon, UploadIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { storageProvider } from '@/lib/storage-provider'

interface AdaptiveFileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (error: Error) => void
  maxFiles?: number
  acceptedFileTypes?: string[]
  className?: string
  inquiryId?: string
}

interface UploadedFile {
  fileId: string
  fileName: string
  fileUrl: string
  uploadedBy: string
}

interface SystemSettings {
  storageProvider: 'UPLOADTHING' | 'LOCAL'
  maxFileSize: number
  allowedFileTypes: string[]
}

export function AdaptiveFileUpload({ 
  onUploadComplete, 
  onUploadError,
  maxFiles = 5,
  acceptedFileTypes,
  className = "",
  inquiryId
}: AdaptiveFileUploadProps) {
  const t = useTranslations()
  const [isUploading, setIsUploading] = useState(false)
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    // Fetch storage settings
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/system-settings')
        if (response.ok) {
          const data = await response.json()
          setSettings({
            storageProvider: data.storageProvider,
            maxFileSize: data.maxFileSize,
            allowedFileTypes: data.allowedFileTypes
          })
        }
      } catch (error) {
        console.error('Failed to fetch storage settings:', error)
      }
    }
    fetchSettings()
  }, [refreshKey])

  // Refresh settings when the window gains focus (user might have changed settings in another tab)
  useEffect(() => {
    const handleFocus = () => {
      setRefreshKey(prev => prev + 1)
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > maxFiles) {
      toast.error(t('attachments.upload.tooManyFiles', { max: maxFiles }))
      return
    }
    setSelectedFiles(files)
  }

  const handleLocalUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    
    try {
      // For local storage, we need to create a custom upload endpoint
      const formData = new FormData()
      selectedFiles.forEach((file, index) => {
        formData.append(`file${index}`, file)
      })
      
      if (inquiryId) {
        formData.append('inquiryId', inquiryId)
      }

      const response = await fetch('/api/upload/local', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      
      toast.success(t('attachments.upload.success', { count: result.files.length }))
      onUploadComplete?.(result.files)
      setSelectedFiles([])
      
      // Reset the file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(t('attachments.upload.failed', { error: error.message }))
      onUploadError?.(error)
    } finally {
      setIsUploading(false)
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  // Use UploadThing component for cloud storage
  if (settings.storageProvider === 'UPLOADTHING') {
    return (
      <FileUpload
        endpoint="inquiryDocumentUploader"
        onUploadComplete={onUploadComplete}
        onUploadError={onUploadError}
        maxFiles={maxFiles}
        showDropzone={true}
        className={className}
      />
    )
  }

  // Use custom component for local storage
  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center">
            <UploadIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <label htmlFor="file-upload-input" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById('file-upload-input')?.click()
                  }}
                >
                  {t('attachments.selectFiles')}
                </Button>
                <input
                  id="file-upload-input"
                  type="file"
                  multiple={maxFiles > 1}
                  accept={acceptedFileTypes?.join(',') || settings.allowedFileTypes.join(',')}
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="sr-only"
                />
              </div>
            </label>
            <p className="text-sm text-muted-foreground mt-2">
              Max file size: {Math.round(settings.maxFileSize / 1048576)}MB
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t('attachments.selectedFiles')}</h4>
              <div className="space-y-1">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{file.name}</span>
                    <span className="text-muted-foreground">
                      ({Math.round(file.size / 1024)}KB)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedFiles.length > 0 && (
            <Button
              onClick={handleLocalUpload}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('attachments.upload.uploading')}
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  {t('attachments.upload.uploadFiles')}
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}