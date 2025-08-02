'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { 
  FileIcon, 
  FileTextIcon, 
  ImageIcon, 
  FileSpreadsheetIcon,
  FileText,
  FileArchiveIcon,
  FolderIcon,
  DownloadIcon,
  ExternalLinkIcon,
  Loader2
} from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import { format } from 'date-fns'

interface FileInfo {
  name: string
  path: string
  size: number
  type: string
  mimeType?: string
  createdAt: string
  updatedAt: string
  isDirectory: boolean
}

interface FolderBrowserModalProps {
  inquiryId: string
  isOpen: boolean
  onClose: () => void
}

export function FolderBrowserModal({ inquiryId, isOpen, onClose }: FolderBrowserModalProps) {
  const t = useTranslations()
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<FileInfo[]>([])
  const [currentPath, setCurrentPath] = useState<string>('')
  const [folderExists, setFolderExists] = useState(false)

  const fetchFolderContents = useCallback(async () => {
    setLoading(true)
    try {
      const pathParam = currentPath ? `?path=${encodeURIComponent(currentPath)}` : ''
      const response = await fetch(`/api/inquiries/${inquiryId}/documents/browse${pathParam}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch folder contents')
      }

      setFiles(data.files || [])
      setFolderExists(data.exists)
      
      if (!data.exists) {
        toast.info(t('attachments.folder.notFound'))
      }
    } catch (error) {
      console.error('Failed to fetch folder contents:', error)
      toast.error(t('attachments.folder.loadFailed'))
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [inquiryId, currentPath, t])

  useEffect(() => {
    if (isOpen && inquiryId) {
      fetchFolderContents()
    }
  }, [isOpen, inquiryId, fetchFolderContents])

  const getFileIcon = (file: FileInfo) => {
    if (file.isDirectory) return <FolderIcon className="h-5 w-5" />
    
    const ext = file.name.split('.').pop()?.toLowerCase()
    const mimeType = file.mimeType?.toLowerCase()
    
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <ImageIcon className="h-5 w-5" />
    }
    if (mimeType?.includes('pdf') || ext === 'pdf') {
      return <FileText className="h-5 w-5" />
    }
    if (mimeType?.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheetIcon className="h-5 w-5" />
    }
    if (mimeType?.includes('zip') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      return <FileArchiveIcon className="h-5 w-5" />
    }
    if (mimeType?.startsWith('text/') || ['txt', 'md', 'doc', 'docx'].includes(ext || '')) {
      return <FileTextIcon className="h-5 w-5" />
    }
    
    return <FileIcon className="h-5 w-5" />
  }

  const handleFileClick = async (file: FileInfo) => {
    if (file.isDirectory) {
      // Navigate into directory
      setCurrentPath(file.path)
      return
    }

    // Open file with system default application
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/documents/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: file.path })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to open file')
      }

      toast.success(t('attachments.file.opened', { name: file.name }))
    } catch (error) {
      console.error('Failed to open file:', error)
      // Fallback to download
      handleDownload(file)
    }
  }

  const handleDownload = async (file: FileInfo) => {
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/documents/download?path=${encodeURIComponent(file.path)}`)
      
      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(t('attachments.file.downloaded', { name: file.name }))
    } catch (error) {
      console.error('Failed to download file:', error)
      toast.error(t('attachments.file.downloadFailed'))
    }
  }

  const navigateUp = () => {
    const parts = currentPath.split('/')
    parts.pop()
    setCurrentPath(parts.join('/'))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t('attachments.folder.browser')}</DialogTitle>
          <DialogDescription>
            {t('attachments.folder.browserDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Path navigation */}
          {currentPath && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateUp}
                className="h-8"
              >
                {t('common.back')}
              </Button>
              <span className="truncate">{currentPath}</span>
            </div>
          )}

          {/* File list */}
          <ScrollArea className="h-[400px] rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !folderExists ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FolderIcon className="h-12 w-12 mb-2" />
                <p>{t('attachments.folder.empty')}</p>
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FolderIcon className="h-12 w-12 mb-2" />
                <p>{t('attachments.folder.noFiles')}</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {!file.isDirectory && (
                            <span>{formatFileSize(file.size)}</span>
                          )}
                          <span>{format(new Date(file.updatedAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    {!file.isDirectory && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(file)
                          }}
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleFileClick(file)
                          }}
                        >
                          <ExternalLinkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}