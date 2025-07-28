"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { 
  Download, 
  FileSpreadsheet, 
  Loader2,
  Table
} from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ExcelExportButtonProps {
  entityType: 'inquiries' | 'users' | 'customers'
  filters?: Record<string, any>
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'lg' | 'sm' | 'icon'
  className?: string
  disabled?: boolean
}

export function ExcelExportButton({ 
  entityType,
  filters = {},
  variant = 'outline', 
  size = 'sm',
  className = '',
  disabled = false
}: ExcelExportButtonProps) {
  const t = useTranslations()
  const [isExporting, setIsExporting] = useState(false)

  const exportToExcel = async (includeOptions: { includeSummary?: boolean; fileName?: string } = {}) => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/excel/${entityType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters,
          includeDetails: true,
          includeSummary: includeOptions.includeSummary || false,
          fileName: includeOptions.fileName || undefined
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('excel.export.failed'))
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      // Extract filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `${entityType}-export.xlsx`
      a.download = filename
      
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(t('excel.export.success', { entityType: getEntityLabel() }))
    } catch (error) {
      console.error('Excel export error:', error)
      toast.error(error instanceof Error ? error.message : t('excel.export.failed'))
    } finally {
      setIsExporting(false)
    }
  }

  const getEntityLabel = () => {
    switch (entityType) {
      case 'inquiries': return t('navigation.inquiries')
      case 'users': return t('navigation.users')
      case 'customers': return t('navigation.customers')
      default: return t('common.data')
    }
  }

  // Simple export button for single entity
  if (entityType === 'users' || entityType === 'customers') {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => exportToExcel()}
        disabled={isExporting || disabled}
        className={className}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 mr-2" />
        )}
        {isExporting ? t('excel.export.exporting') : t('excel.export.button', { entityType: getEntityLabel() })}
      </Button>
    )
  }

  // Advanced dropdown for inquiries with more options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isExporting || disabled}
          className={className}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 mr-2" />
          )}
          {isExporting ? t('excel.export.exporting') : t('excel.export.button', { entityType: getEntityLabel() })}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportToExcel()}>
          <Table className="h-4 w-4 mr-2" />
          {t('excel.export.basic')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToExcel({ includeSummary: true })}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {t('excel.export.withSummary')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToExcel({ 
          includeSummary: true, 
          fileName: `${entityType}-detailed-${new Date().toISOString().split('T')[0]}.xlsx` 
        })}>
          <Download className="h-4 w-4 mr-2" />
          {t('excel.export.detailed')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}