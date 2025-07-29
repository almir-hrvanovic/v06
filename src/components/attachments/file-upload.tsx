"use client"

import { useState } from 'react'
import { UploadButton, UploadDropzone } from '@/lib/uploadthing'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FileIcon, ImageIcon, TrashIcon, DownloadIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface FileUploadProps {
  endpoint: 'inquiryImageUploader' | 'inquiryDocumentUploader' | 'itemAttachmentUploader'
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (error: Error) => void
  maxFiles?: number
  showDropzone?: boolean
  className?: string
}

interface UploadedFile {
  fileId: string
  fileName: string
  fileUrl: string
  uploadedBy: string
}

interface AttachmentDisplayProps {
  attachments: Array<{
    id: string
    attachment: {
      id: string
      fileName: string
      originalName: string
      fileSize: number
      mimeType: string
      uploadThingUrl: string
      uploadedBy: {
        name: string
        email: string
      }
      createdAt: string
    }
  }>
  onRemove?: (attachmentId: string) => void
  showRemove?: boolean
}

export function FileUpload({ 
  endpoint, 
  onUploadComplete, 
  onUploadError,
  maxFiles = 5,
  showDropzone = true,
  className = ""
}: FileUploadProps) {
  const t = useTranslations()
  const [isUploading, setIsUploading] = useState(false)

  const handleUploadComplete = (res: any[]) => {
    setIsUploading(false)
    console.log('FileUpload: Upload complete response:', res)
    
    const uploadedFiles: UploadedFile[] = res.map(file => ({
      fileId: file.fileId || file.key || '',
      fileName: file.fileName || file.name || '',
      fileUrl: file.fileUrl || file.appUrl || file.url || '',
      uploadedBy: file.uploadedBy || ''
    }))
    
    console.log('FileUpload: Mapped uploaded files:', uploadedFiles)
    
    toast.success(t('attachments.upload.success', { count: res.length }))
    onUploadComplete?.(uploadedFiles)
  }

  const handleUploadError = (error: Error) => {
    setIsUploading(false)
    
    // Handle specific UploadThing configuration error
    if (error.message.includes('UploadThing not configured') || error.message.includes('503')) {
      toast.error('File upload service is not configured. Please contact the administrator.')
    } else {
      toast.error(t('attachments.upload.failed', { error: error.message }))
    }
    
    onUploadError?.(error)
  }

  const handleUploadBegin = () => {
    setIsUploading(true)
  }

  if (showDropzone) {
    return (
      <div className={`space-y-4 ${className}`}>
        <UploadDropzone
          endpoint={endpoint}
          onClientUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          onUploadBegin={handleUploadBegin}
          className="border-dashed border-2 border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
        />
        {isUploading && (
          <div className="text-center text-sm text-gray-500">
            {t('attachments.upload.uploading')}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <UploadButton
        endpoint={endpoint}
        onClientUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        onUploadBegin={handleUploadBegin}
        className="ut-button:bg-primary ut-button:hover:bg-primary/90"
      />
      {isUploading && (
        <div className="text-center text-sm text-muted-foreground">
          {t('attachments.upload.uploading')}
        </div>
      )}
    </div>
  )
}

export function AttachmentDisplay({ 
  attachments, 
  onRemove, 
  showRemove = true 
}: AttachmentDisplayProps) {
  const t = useTranslations()
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = [t('common.files.sizes.bytes'), t('common.files.sizes.kb'), t('common.files.sizes.mb'), t('common.files.sizes.gb')]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-primary" />
    }
    return <FileIcon className="h-5 w-5 text-muted-foreground" />
  }

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {t('attachments.noAttachments')}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {attachments.map((item) => (
        <Card key={item.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(item.attachment.mimeType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.attachment.originalName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(item.attachment.fileSize)} • 
                  {t('attachments.uploadedBy', { name: item.attachment.uploadedBy.name })} • 
                  {new Date(item.attachment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(item.attachment.uploadThingUrl, item.attachment.fileName)}
              >
                <DownloadIcon className="h-4 w-4" />
              </Button>
              {showRemove && onRemove && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemove(item.attachment.id)}
                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}