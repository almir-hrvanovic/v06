"use client"

import { useState } from 'react'
import { AttachmentDisplay } from './file-upload'
import { AdaptiveFileUpload } from './adaptive-file-upload'
import { useAttachments } from '@/hooks/use-attachments'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface AttachmentManagerProps {
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

export function AttachmentManager({ 
  inquiryId, 
  itemId, 
  title,
  showUpload = true,
  className = "" 
}: AttachmentManagerProps) {
  const t = useTranslations()
  const [showUploadForm, setShowUploadForm] = useState(false)
  const { attachments, loading, linkAttachment, removeAttachment, refetch } = useAttachments({
    inquiryId,
    itemId,
  })

  const handleUploadComplete = async (uploadedFiles: UploadedFile[]) => {
    console.log('Upload complete, received files:', uploadedFiles)
    // For local storage, files are already linked during upload
    // For UploadThing, we need to link them manually
    try {
      // Get storage settings to check provider
      const settingsResponse = await fetch('/api/system-settings', {
        credentials: 'include'
      })
      const settings = await settingsResponse.json()
      
      if (settings.storageProvider === 'UPLOADTHING') {
        // Only link files for UploadThing storage
        for (const file of uploadedFiles) {
          console.log('Linking file:', file)
          await linkAttachment(file.fileId)
        }
      }
      
      setShowUploadForm(false)
      // Refresh the attachments list
      refetch()
    } catch (error) {
      console.error('Failed to process uploaded files:', error)
    }
  }

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (confirm(t('attachments.confirmRemove'))) {
      await removeAttachment(attachmentId)
    }
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">{title || t('attachments.title')}</h3>
        </div>
        <div className="text-center text-muted-foreground">
          {t('attachments.loading')}
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">{title}</h3>
        {showUpload && !showUploadForm && (
          <Button 
            onClick={() => setShowUploadForm(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            {t('attachments.addFiles')}
          </Button>
        )}
      </div>

      {showUploadForm && (
        <div className="mb-6">
          <Tabs defaultValue="images" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="images">{t('attachments.tabs.images')}</TabsTrigger>
              <TabsTrigger value="documents">{t('attachments.tabs.documents')}</TabsTrigger>
              <TabsTrigger value="items">{t('attachments.tabs.itemFiles')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="images" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                {t('attachments.upload.imageInstructions')}
              </div>
              <AdaptiveFileUpload
                inquiryId={inquiryId}
                onUploadComplete={handleUploadComplete}
                onUploadError={(error) => {
                  console.error('Upload error:', error)
                }}
                maxFiles={5}
              />
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                {t('attachments.upload.documentInstructions')}
              </div>
              <AdaptiveFileUpload
                inquiryId={inquiryId}
                onUploadComplete={handleUploadComplete}
                onUploadError={(error) => {
                  console.error('Upload error:', error)
                }}
                maxFiles={10}
              />
            </TabsContent>
            
            <TabsContent value="items" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                {t('attachments.upload.itemInstructions')}
              </div>
              <AdaptiveFileUpload
                inquiryId={inquiryId}
                onUploadComplete={handleUploadComplete}
                onUploadError={(error) => {
                  console.error('Upload error:', error)
                }}
                maxFiles={5}
              />
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowUploadForm(false)}
            >
              {t('buttons.cancel')}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {attachments.length > 0 ? (
          <AttachmentDisplay
            attachments={attachments}
            onRemove={handleRemoveAttachment}
            showRemove={true}
          />
        ) : (
          !showUploadForm && (
            <div className="text-center text-muted-foreground py-8">
              <div className="text-lg mb-2">{t('attachments.noAttachmentsYet')}</div>
              <div className="text-sm">
                {showUpload ? t('attachments.clickToUpload') : t('attachments.noFilesAttached')}
              </div>
            </div>
          )
        )}
      </div>
    </Card>
  )
}