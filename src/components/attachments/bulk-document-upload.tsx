"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { UploadDropzone } from '@/lib/uploadthing'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { FileIcon, FolderIcon, UploadIcon, XIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface BulkDocumentUploadProps {
  inquiryId: string
  onUploadComplete?: () => void
}

interface UploadedFile {
  fileId: string
  fileName: string
  fileUrl: string
  uploadedBy: string
}

export function BulkDocumentUpload({ inquiryId, onUploadComplete }: BulkDocumentUploadProps) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleUploadComplete = async (res: any[]) => {
    setIsUploading(false)
    
    const files: UploadedFile[] = res.map(file => ({
      fileId: file.fileId,
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      uploadedBy: file.uploadedBy
    }))
    
    setUploadedFiles(prev => [...prev, ...files])
    
    // Create folder structure and save files
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: files.map(file => ({
            name: file.fileName,
            url: file.fileUrl,
            size: 0, // Size will be retrieved from the actual file
            type: 'application/octet-stream', // Default type
          }))
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save documents')
      }

      toast.success(t('attachments.bulk.uploadSuccess', { count: files.length }))
      onUploadComplete?.()
      setIsOpen(false)
      setUploadedFiles([])
    } catch (error) {
      console.error('Failed to save documents:', error)
      toast.error(t('attachments.bulk.uploadFailed'))
    }
  }

  const handleUploadError = (error: Error) => {
    setIsUploading(false)
    toast.error(t('attachments.upload.failed', { error: error.message }))
  }

  const handleUploadBegin = () => {
    setIsUploading(true)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <FolderIcon className="h-4 w-4" />
        {t('attachments.bulk.addDocumentation')}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('attachments.bulk.title')}</DialogTitle>
            <DialogDescription>
              {t('attachments.bulk.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <UploadDropzone
              endpoint="inquiryDocumentUploader"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              onUploadBegin={handleUploadBegin}
              className="border-dashed border-2 border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
              content={{
                label: t('attachments.bulk.dropzone.label'),
                allowedContent: t('attachments.bulk.dropzone.allowedContent'),
              }}
            />

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t('attachments.bulk.uploadedFiles')}</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <Card key={index} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{file.fileName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {isUploading && (
              <div className="text-center text-sm text-gray-500">
                <UploadIcon className="h-6 w-6 animate-pulse mx-auto mb-2" />
                {t('attachments.upload.uploading')}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}