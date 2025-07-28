"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  FileText, 
  Download, 
  Loader2, 
  Calendar,
  Filter,
  BarChart3,
  Users,
  Building2
} from 'lucide-react'

interface ReportGeneratorProps {
  isOpen: boolean
  onClose: () => void
}

interface ReportConfig {
  title: string
  subtitle?: string
  type: 'inquiries' | 'users' | 'customers' | 'analytics'
  dateRange: {
    from: string
    to: string
  }
  filters: Record<string, any>
  includeDetails: boolean
  includeSummary: boolean
}

export function ReportGenerator({ isOpen, onClose }: ReportGeneratorProps) {
  const t = useTranslations('toasts.reports')
  const tLabels = useTranslations('labels.reports')
  const tPlaceholders = useTranslations('placeholders.reports')
  const tButtons = useTranslations('buttons')
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportTypes, setReportTypes] = useState<any[]>([])
  const [config, setConfig] = useState<ReportConfig>({
    title: '',
    subtitle: '',
    type: 'inquiries',
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    },
    filters: {},
    includeDetails: true,
    includeSummary: true
  })

  // Form state for filters
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchReportTypes()
    }
  }, [isOpen])

  useEffect(() => {
    // Update filters in config when selections change
    const newFilters: Record<string, any> = {}
    
    if (selectedStatuses.length > 0) newFilters.status = selectedStatuses
    if (selectedPriorities.length > 0) newFilters.priority = selectedPriorities
    if (selectedRoles.length > 0) newFilters.role = selectedRoles
    
    setConfig(prev => ({ ...prev, filters: newFilters }))
  }, [selectedStatuses, selectedPriorities, selectedRoles])

  const fetchReportTypes = async () => {
    try {
      const response = await fetch('/api/pdf/report')
      if (response.ok) {
        const data = await response.json()
        setReportTypes(data.reportTypes)
      }
    } catch (error) {
      console.error('Failed to fetch report types:', error)
    }
  }

  const generateReport = async () => {
    if (!config.title.trim()) {
      toast.error(t('titleRequired'))
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/pdf/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('generateError'))
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      // Extract filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'report.pdf'
      a.download = filename
      
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(t('generateSuccess'))
      onClose()
    } catch (error) {
      console.error('Report generation error:', error)
      toast.error(error instanceof Error ? error.message : t('generateError'))
    } finally {
      setIsGenerating(false)
    }
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      inquiries: <FileText className="h-4 w-4" />,
      users: <Users className="h-4 w-4" />,
      customers: <Building2 className="h-4 w-4" />,
      analytics: <BarChart3 className="h-4 w-4" />
    }
    return icons[type as keyof typeof icons] || <FileText className="h-4 w-4" />
  }

  const selectedReportType = reportTypes.find(rt => rt.type === config.type)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>{tButtons('generateReport')}</span>
          </DialogTitle>
          <DialogDescription>
            Create custom PDF reports with advanced filtering and formatting options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Type Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{tLabels('reportType')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTypes.map((type) => (
                  <div
                    key={type.type}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      config.type === type.type 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setConfig(prev => ({ ...prev, type: type.type }))}
                  >
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(type.type)}
                      <div>
                        <h3 className="font-medium">{type.name}</h3>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{tLabels('reportInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title *</Label>
                  <Input
                    id="title"
                    value={config.title}
                    onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={tPlaceholders('enterTitle')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                  <Input
                    id="subtitle"
                    value={config.subtitle || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder={tPlaceholders('enterSubtitle')}
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>{tLabels('dateRange')}</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <Label htmlFor="from" className="text-sm">From:</Label>
                    <Input
                      id="from"
                      type="date"
                      value={config.dateRange.from}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, from: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="to" className="text-sm">To:</Label>
                    <Input
                      id="to"
                      type="date"
                      value={config.dateRange.to}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, to: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          {selectedReportType && selectedReportType.filters.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>{tLabels('filters')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Filter */}
                {selectedReportType.filters.includes('status') && (
                  <div className="space-y-2">
                    <Label>{tLabels('status')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {['DRAFT', 'SUBMITTED', 'ASSIGNED', 'COSTING', 'QUOTED', 'APPROVED'].map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status}`}
                            checked={selectedStatuses.includes(status)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStatuses(prev => [...prev, status])
                              } else {
                                setSelectedStatuses(prev => prev.filter(s => s !== status))
                              }
                            }}
                          />
                          <Label htmlFor={`status-${status}`} className="text-sm">
                            {status}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority Filter */}
                {selectedReportType.filters.includes('priority') && (
                  <div className="space-y-2">
                    <Label>{tLabels('priority')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => (
                        <div key={priority} className="flex items-center space-x-2">
                          <Checkbox
                            id={`priority-${priority}`}
                            checked={selectedPriorities.includes(priority)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPriorities(prev => [...prev, priority])
                              } else {
                                setSelectedPriorities(prev => prev.filter(p => p !== priority))
                              }
                            }}
                          />
                          <Label htmlFor={`priority-${priority}`} className="text-sm">
                            {priority}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Role Filter */}
                {selectedReportType.filters.includes('role') && (
                  <div className="space-y-2">
                    <Label>User Roles</Label>
                    <div className="flex flex-wrap gap-2">
                      {['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'].map((role) => (
                        <div key={role} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role}`}
                            checked={selectedRoles.includes(role)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRoles(prev => [...prev, role])
                              } else {
                                setSelectedRoles(prev => prev.filter(r => r !== role))
                              }
                            }}
                          />
                          <Label htmlFor={`role-${role}`} className="text-sm">
                            {role}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Options */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Report Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDetails"
                  checked={config.includeDetails}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeDetails: !!checked }))
                  }
                />
                <Label htmlFor="includeDetails">Include detailed data tables</Label>
              </div>
              
              {selectedReportType?.includeSummary && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSummary"
                    checked={config.includeSummary}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, includeSummary: !!checked }))
                    }
                  />
                  <Label htmlFor="includeSummary">Include summary statistics</Label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Filters Display */}
          {Object.keys(config.filters).length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Active Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(config.filters).map(([key, value]) => (
                    <Badge key={key} variant="secondary">
                      {key}: {Array.isArray(value) ? `${value.length} selected` : String(value)}
                    </Badge>
                  ))}
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
          <Button onClick={generateReport} disabled={isGenerating || !config.title.trim()}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Generate PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}