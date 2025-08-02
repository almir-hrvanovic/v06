"use client"

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  Info,
  Calendar,
  Filter,
  BarChart3
} from 'lucide-react'

interface ExcelExportDialogProps {
  isOpen: boolean
  onClose: () => void
  entityType: 'inquiries' | 'users' | 'customers'
  filters?: Record<string, any>
}

interface ExportStats {
  totalRecords: number
  recentRecords?: number
  maxRecords: number
  supportedFormats: string[]
  features: {
    includeSummary: boolean
    includeFormatting: boolean
    includeCharts: boolean
    customColumns: boolean
  }
  [key: string]: any
}

export function ExcelExportDialog({ 
  isOpen, 
  onClose, 
  entityType,
  filters = {}
}: ExcelExportDialogProps) {
  const t = useTranslations('toasts.exports')
  const tPlaceholders = useTranslations('placeholders.reports')
  const tButtons = useTranslations('buttons')
  const [isExporting, setIsExporting] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [exportStats, setExportStats] = useState<ExportStats | null>(null)
  const [exportConfig, setExportConfig] = useState({
    fileName: '',
    includeDetails: true,
    includeSummary: false,
    includeFormatting: true
  })

  const fetchExportStats = useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const response = await fetch(`/api/excel/${entityType}`)
      if (response.ok) {
        const stats = await response.json()
        setExportStats(stats)
        // Enable summary if supported
        if (stats.features.includeSummary) {
          setExportConfig(prev => ({ ...prev, includeSummary: true }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch export stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }, [entityType])

  useEffect(() => {
    if (isOpen) {
      fetchExportStats()
      // Set default filename
      setExportConfig(prev => ({
        ...prev,
        fileName: `${entityType}-export-${new Date().toISOString().split('T')[0]}.xlsx`
      }))
    }
  }, [isOpen, entityType, fetchExportStats])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/excel/${entityType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters,
          ...exportConfig
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate Excel export')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      // Use configured filename or extract from headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || exportConfig.fileName
      a.download = filename
      
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(t('excelSuccess'))
      onClose()
    } catch (error) {
      console.error('Excel export error:', error)
      toast.error(error instanceof Error ? error.message : t('exportError'))
    } finally {
      setIsExporting(false)
    }
  }

  const getEntityLabel = () => {
    switch (entityType) {
      case 'inquiries': return 'Inquiries'
      case 'users': return 'Users'
      case 'customers': return 'Customers'
      default: return 'Data'
    }
  }

  const renderStatsBreakdown = () => {
    if (!exportStats) return null

    return (
      <div className="grid grid-cols-2 gap-4">
        {exportStats.statusBreakdown && (
          <div>
            <h4 className="font-medium mb-2">Status Breakdown</h4>
            <div className="space-y-1">
              {Object.entries(exportStats.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span>{status}:</span>
                  <Badge variant="secondary">{String(count)}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {exportStats.priorityBreakdown && (
          <div>
            <h4 className="font-medium mb-2">Priority Breakdown</h4>
            <div className="space-y-1">
              {Object.entries(exportStats.priorityBreakdown).map(([priority, count]) => (
                <div key={priority} className="flex justify-between text-sm">
                  <span>{priority}:</span>
                  <Badge variant="secondary">{String(count)}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {exportStats.roleBreakdown && (
          <div>
            <h4 className="font-medium mb-2">Role Breakdown</h4>
            <div className="space-y-1">
              {Object.entries(exportStats.roleBreakdown).map(([role, count]) => (
                <div key={role} className="flex justify-between text-sm">
                  <span>{role}:</span>
                  <Badge variant="secondary">{String(count)}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {exportStats.inquiryStats && (
          <div>
            <h4 className="font-medium mb-2">Customer Statistics</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>With Inquiries:</span>
                <Badge variant="secondary">{exportStats.inquiryStats.withInquiries}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Without Inquiries:</span>
                <Badge variant="secondary">{exportStats.inquiryStats.withoutInquiries}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Active Customers:</span>
                <Badge variant="secondary">{exportStats.inquiryStats.activeCustomers}</Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Export {getEntityLabel()} to Excel</span>
          </DialogTitle>
          <DialogDescription>
            Configure your Excel export settings and download your data in a formatted spreadsheet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Statistics */}
          {isLoadingStats ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading export statistics...</span>
                </div>
              </CardContent>
            </Card>
          ) : exportStats && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Export Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{exportStats.totalRecords || exportStats.totalInquiries || exportStats.totalUsers || exportStats.totalCustomers}</p>
                    <p className="text-sm text-gray-600">Total Records</p>
                  </div>
                  {exportStats.recentRecords && (
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{exportStats.recentRecords || exportStats.recentInquiries || exportStats.recentUsers || exportStats.recentCustomers}</p>
                      <p className="text-sm text-gray-600">Recent (30 days)</p>
                    </div>
                  )}
                  {exportStats.activeUsers && (
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-yellow-600">{exportStats.activeUsers || exportStats.activeCustomers}</p>
                      <p className="text-sm text-gray-600">Active</p>
                    </div>
                  )}
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{exportStats.maxRecords}</p>
                    <p className="text-sm text-gray-600">Max Export</p>
                  </div>
                </div>

                {renderStatsBreakdown()}
              </CardContent>
            </Card>
          )}

          {/* Applied Filters */}
          {Object.keys(filters).length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Applied Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => (
                    <Badge key={key} variant="secondary">
                      {key}: {Array.isArray(value) ? `${value.length} selected` : String(value)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Configuration */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Export Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fileName">File Name</Label>
                <Input
                  id="fileName"
                  value={exportConfig.fileName}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, fileName: e.target.value }))}
                  placeholder={tPlaceholders('customFilename')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDetails"
                    checked={exportConfig.includeDetails}
                    onCheckedChange={(checked) => 
                      setExportConfig(prev => ({ ...prev, includeDetails: !!checked }))
                    }
                  />
                  <Label htmlFor="includeDetails">Include detailed data</Label>
                </div>
                
                {exportStats?.features.includeSummary && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeSummary"
                      checked={exportConfig.includeSummary}
                      onCheckedChange={(checked) => 
                        setExportConfig(prev => ({ ...prev, includeSummary: !!checked }))
                      }
                    />
                    <Label htmlFor="includeSummary">Include summary sheet</Label>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeFormatting"
                    checked={exportConfig.includeFormatting}
                    onCheckedChange={(checked) => 
                      setExportConfig(prev => ({ ...prev, includeFormatting: !!checked }))
                    }
                  />
                  <Label htmlFor="includeFormatting">Include formatting</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Features */}
          {exportStats && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5" />
                  <span>Export Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${exportStats.features.includeFormatting ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Conditional Formatting</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${exportStats.features.includeSummary ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Summary Statistics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${exportStats.features.customColumns ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Auto-sized Columns</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${exportStats.features.includeCharts ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Charts & Graphs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !exportConfig.fileName.trim()}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}