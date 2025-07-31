'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FolderSearchIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FolderBrowserModal } from './folder-browser-modal'

interface BrowseFolderButtonProps {
  inquiryId: string
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function BrowseFolderButton({ 
  inquiryId, 
  className = '',
  variant = 'outline',
  size = 'default'
}: BrowseFolderButtonProps) {
  const t = useTranslations()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        onClick={handleOpenModal}
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
      >
        <FolderSearchIcon className="h-4 w-4" />
        {t('attachments.folder.browse')}
      </Button>

      {isModalOpen && (
        <FolderBrowserModal
          inquiryId={inquiryId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}