"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AdaptiveFileUpload } from './adaptive-file-upload'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { FileIcon, FolderIcon, XIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface BulkDocumentUploadV2Props {
  inquiryId: string
  onUploadComplete?: () => void
}

interface UploadedFile {
  fileId: string
  fileName: string
  fileUrl: string
  uploadedBy: string
}

export function BulkDocumentUploadV2({ inquiryId, onUploadComplete }: BulkDocumentUploadV2Props) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleUploadComplete = async (files: UploadedFile[]) => {
    // Only process if files were actually uploaded
    if (!files || files.length === 0) {
      return
    }
    
    setUploadedFiles(prev => [...prev, ...files])
    
    // Create folder structure if needed (for UploadThing uploads)
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/documents`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (!data.data.exists) {
          // Create the folder structure
          await fetch(`/api/inquiries/${inquiryId}/documents`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ files: [] })
          })
        }
      }
      
      toast.success(t('attachments.bulk.uploadSuccess', { count: files.length }))
      
      // Close dialog after successful upload
      setTimeout(() => {
        handleClose()
      }, 1000)
    } catch (error) {
      console.error('Failed to create folder structure:', error)
      toast.error(t('attachments.upload.failed'))
    }
  }

  const handleUploadError = (error: Error) => {
    toast.error(t('attachments.upload.failed', { error: error.message }))
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    if (uploadedFiles.length > 0) {
      onUploadComplete?.()
      setUploadedFiles([])
    }
    setIsOpen(false)
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

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('attachments.bulk.title')}</DialogTitle>
            <DialogDescription>
              {t('attachments.bulk.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <AdaptiveFileUpload
              inquiryId={inquiryId}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              maxFiles={10}
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}