"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FolderOpenIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface OpenFolderButtonProps {
  inquiryId: string
  className?: string
}

interface SystemSettings {
  storageProvider: 'UPLOADTHING' | 'LOCAL'
  localStoragePath?: string
}

export function OpenFolderButton({ inquiryId, className = "" }: OpenFolderButtonProps) {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  
  useEffect(() => {
    // Fetch storage settings
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/system-settings')
        if (response.ok) {
          const data = await response.json()
          setSettings({
            storageProvider: data.storageProvider,
            localStoragePath: data.localStoragePath
          })
        }
      } catch (error) {
        console.error('Failed to fetch storage settings:', error)
      }
    }
    fetchSettings()
  }, [])

  const handleOpenFolder = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/documents`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get folder information')
      }

      if (!data.data.exists) {
        // Create the folder if it doesn't exist
        try {
          const createResponse = await fetch(`/api/inquiries/${inquiryId}/documents`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ files: [] }) // Create empty folder structure
          })
          
          if (createResponse.ok) {
            toast.success(t('attachments.folder.created'))
          } else {
            toast.info(t('attachments.folder.notFound'))
          }
        } catch (error) {
          toast.info(t('attachments.folder.notFound'))
        }
        return
      }

      // Show folder information
      if (settings?.storageProvider === 'LOCAL') {
        toast.info(
          `Folder location: ${data.data.folderPath}\n` +
          `Files: ${data.data.fileCount}\n\n` +
          `Note: In a desktop application, this would open the folder in your file explorer.`
        )
      } else {
        toast.success(t('attachments.folder.opened', { 
          path: data.data.folderPath,
          count: data.data.fileCount 
        }))
      }

      // In a real desktop app with Electron:
      // window.electronAPI.openFolder(data.data.folderPath)
      
      // For now, we could open a file browser view:
      // router.push(`/dashboard/inquiries/${inquiryId}/files`)
      
    } catch (error) {
      console.error('Failed to open folder:', error)
      toast.error(t('attachments.folder.openFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleOpenFolder}
      variant="outline"
      size="sm"
      disabled={isLoading}
      className={`gap-2 ${className}`}
    >
      <FolderOpenIcon className="h-4 w-4" />
      {t('attachments.folder.open')}
    </Button>
  )
}