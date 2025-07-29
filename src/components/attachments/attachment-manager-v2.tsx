"use client"

import { useState } from 'react'
import { AdaptiveFileUpload } from './adaptive-file-upload'
import { AttachmentDisplay } from './file-upload'
import { useAttachments } from '@/hooks/use-attachments'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface AttachmentManagerV2Props {
  inquiryId?: string
  itemId?: string
  title?: string
  showUpload?: boolean
  className?: string
}

interface UploadedFile {
  fileId: string
  fileName: string
  fileUrl: string
  uploadedBy: string
}

export function AttachmentManagerV2({ 
  inquiryId, 
  itemId, 
  title,
  showUpload = true,
  className = "" 
}: AttachmentManagerV2Props) {
  const t = useTranslations()
  const [showUploadForm, setShowUploadForm] = useState(false)
  const { attachments, loading, linkAttachment, removeAttachment, refetch } = useAttachments({
    inquiryId,
    itemId,
  })

  const handleUploadComplete = async (uploadedFiles: UploadedFile[]) => {
    console.log('Upload complete, received files:', uploadedFiles)
    // Link each uploaded file to the inquiry or item
    try {
      for (const file of uploadedFiles) {
        console.log('Linking file:', file)
        await linkAttachment(file.fileId)
      }
      setShowUploadForm(false)
      // Refresh the attachments list
      await refetch()
    } catch (error) {
      console.error('Failed to link attachments:', error)
    }
  }

  const handleRemove = async (attachmentId: string) => {
    try {
      await removeAttachment(attachmentId)
      await refetch()
    } catch (error) {
      console.error('Failed to remove attachment:', error)
    }
  }

  const endpoint = itemId ? 'itemAttachmentUploader' : 'inquiryDocumentUploader'

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {title || t('attachments.title')}
          </h3>
          {showUpload && !showUploadForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadForm(true)}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              {t('attachments.add')}
            </Button>
          )}
        </div>

        {showUploadForm && (
          <div className="space-y-4">
            <AdaptiveFileUpload
              inquiryId={inquiryId}
              onUploadComplete={handleUploadComplete}
              onUploadError={(error) => {
                console.error('Upload error:', error)
                setShowUploadForm(false)
              }}
              maxFiles={5}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadForm(false)}
              className="w-full"
            >
              {t('common.cancel')}
            </Button>
          </div>
        )}

        {!showUploadForm && (
          <div>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : (
              <AttachmentDisplay
                attachments={attachments}
                onRemove={handleRemove}
                showRemove={showUpload}
              />
            )}
          </div>
        )}
      </div>
    </Card>
  )
}