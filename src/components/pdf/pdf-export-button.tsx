"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Download, 
  FileText, 
  BarChart3, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface PDFExportButtonProps {
  type: 'quote' | 'report'
  inquiryId?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'lg' | 'sm' | 'icon'
  className?: string
}

export function PDFExportButton({ 
  type, 
  inquiryId, 
  variant = 'default', 
  size = 'default',
  className = ''
}: PDFExportButtonProps) {
  const t = useTranslations('toasts.exports')
  const tTitles = useTranslations('titles')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showQuoteDialog, setShowQuoteDialog] = useState(false)
  const [quoteStatus, setQuoteStatus] = useState<any>(null)

  const generateQuotePDF = async () => {
    if (!inquiryId) {
      toast.error(t('inquiryIdRequired'))
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/pdf/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          inquiryId,
          includeDetails: true,
          validityDays: 30
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate quote PDF')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      // Extract filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'quote.pdf'
      a.download = filename
      
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(t('pdfSuccess'))
    } catch (error) {
      console.error('Quote PDF generation error:', error)
      toast.error(error instanceof Error ? error.message : t('pdfError'))
    } finally {
      setIsGenerating(false)
    }
  }

  const checkQuoteStatus = async () => {
    if (!inquiryId) return

    try {
      const response = await fetch(`/api/pdf/quote?inquiryId=${inquiryId}`)
      if (response.ok) {
        const status = await response.json()
        setQuoteStatus(status)
      }
    } catch (error) {
      console.error('Failed to check quote status:', error)
    }
  }

  const handleQuoteGeneration = async () => {
    await checkQuoteStatus()
    
    if (quoteStatus?.ready) {
      generateQuotePDF()
    } else {
      setShowQuoteDialog(true)
    }
  }

  const openReportGenerator = () => {
    // Open report generator modal/page
    window.open('/dashboard/reports/generator', '_blank')
  }

  if (type === 'quote') {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          onClick={handleQuoteGeneration}
          disabled={isGenerating}
          className={className}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          {isGenerating ? 'Generating...' : 'Generate Quote PDF'}
        </Button>

        <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tTitles('quoteGenerationStatus')}</DialogTitle>
              <DialogDescription>
                Review the current status before generating your quote PDF.
              </DialogDescription>
            </DialogHeader>
            
            {quoteStatus && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {quoteStatus.ready ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className="font-medium">
                    {quoteStatus.ready ? 'Ready to Generate' : 'Missing Information'}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span className="font-medium">{quoteStatus.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Items with Costs:</span>
                    <span className="font-medium">{quoteStatus.costedItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Value:</span>
                    <span className="font-medium">
                      ${quoteStatus.estimatedValue?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {!quoteStatus.ready && quoteStatus.missingCosts?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Items Missing Cost Calculations:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {quoteStatus.missingCosts.map((item: any) => (
                        <li key={item.id}>• {item.name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  {quoteStatus.ready ? (
                    <Button onClick={generateQuotePDF} disabled={isGenerating}>
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Generate PDF
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setShowQuoteDialog(false)}>
                      Complete Cost Calculations First
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setShowQuoteDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (type === 'report') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openReportGenerator}>
            <FileText className="h-4 w-4 mr-2" />
            Inquiries Report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openReportGenerator}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics Report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openReportGenerator}>
            <Download className="h-4 w-4 mr-2" />
            Custom Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return null
}