"use client"

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReportGenerator } from '@/components/pdf/report-generator'
import { PDFExportButton } from '@/components/pdf/pdf-export-button'
import { ExcelExportButton } from '@/components/excel/excel-export-button'
import { ExcelExportDialog } from '@/components/excel/excel-export-dialog'
import { 
  FileText, 
  BarChart3, 
  Users, 
  Building2, 
  TrendingUp,
  Download,
  Calendar,
  Filter,
  Eye,
  Plus
} from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function ReportsPage() {
  const { data: session } = useSession()
  const [showReportGenerator, setShowReportGenerator] = useState(false)
  const [showExcelDialog, setShowExcelDialog] = useState(false)
  const [selectedExcelEntity, setSelectedExcelEntity] = useState<'inquiries' | 'users' | 'customers'>('inquiries')
  const userRole = session?.user?.role

  // Check if user has permission to access reports
  const canAccessReports = ['SUPERUSER', 'ADMIN', 'MANAGER'].includes(userRole || '')

  if (!canAccessReports) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Access denied. You don't have permission to view reports.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const reportTemplates = [
    {
      id: 'inquiries-summary',
      title: 'Inquiries Summary Report',
      description: 'Overview of all inquiries with status, priority, and value analysis',
      icon: <FileText className="h-8 w-8 text-blue-500" />,
      type: 'inquiries' as const,
      estimatedTime: '2-3 min',
      tags: ['Popular', 'Summary']
    },
    {
      id: 'user-activity',
      title: 'User Activity Report', 
      description: 'Detailed report of user activities, roles, and performance metrics',
      icon: <Users className="h-8 w-8 text-green-500" />,
      type: 'users' as const,
      estimatedTime: '1-2 min',
      tags: ['Management']
    },
    {
      id: 'customer-analysis',
      title: 'Customer Analysis Report',
      description: 'Customer engagement, inquiry history, and value analysis',
      icon: <Building2 className="h-8 w-8 text-purple-500" />,
      type: 'customers' as const,
      estimatedTime: '2-3 min',
      tags: ['Sales', 'Analysis']
    },
    {
      id: 'analytics-dashboard',
      title: 'Analytics Dashboard Report',
      description: 'Comprehensive analytics with trends, forecasts, and KPIs',
      icon: <BarChart3 className="h-8 w-8 text-orange-500" />,
      type: 'analytics' as const,
      estimatedTime: '3-5 min',
      tags: ['Advanced', 'Analytics']
    }
  ]

  const recentReports = [
    {
      id: '1',
      title: 'Monthly Inquiries Report - December 2024',
      type: 'Inquiries Report',
      generatedAt: new Date('2024-12-15T10:30:00Z'),
      size: '2.3 MB',
      status: 'completed'
    },
    {
      id: '2', 
      title: 'User Activity Report - Q4 2024',
      type: 'Users Report',
      generatedAt: new Date('2024-12-10T14:15:00Z'),
      size: '1.8 MB',
      status: 'completed'
    },
    {
      id: '3',
      title: 'Customer Analysis - November 2024',
      type: 'Customers Report',
      generatedAt: new Date('2024-11-28T09:45:00Z'),
      size: '3.1 MB',
      status: 'completed'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive PDF reports with advanced filtering and analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setShowReportGenerator(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>PDF Report</span>
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              setSelectedExcelEntity('inquiries')
              setShowExcelDialog(true)
            }}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Excel Export</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Inquiries</div>
            <p className="text-xs text-muted-foreground">
              45% of all reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Generation Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 min</div>
            <p className="text-xs text-muted-foreground">
              -30s from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data Size</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.2 MB</div>
            <p className="text-xs text-muted-foreground">
              Reports storage used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Report Templates</span>
          </CardTitle>
          <CardDescription>
            Choose from pre-configured report templates or create a custom report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {template.icon}
                      <div>
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {template.estimatedTime}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex space-x-2">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => setShowReportGenerator(true)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const entityType = (template.type as string) === 'inquiries-summary' ? 'inquiries' :
                                         (template.type as string) === 'user-activity' ? 'users' : 'customers'
                        setSelectedExcelEntity(entityType as 'inquiries' | 'users' | 'customers')
                        setShowExcelDialog(true)
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Recent Reports</span>
          </CardTitle>
          <CardDescription>
            Your recently generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.map((report) => (
              <div 
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="font-medium">{report.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{report.type}</span>
                      <span>•</span>
                      <span>{report.generatedAt.toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{report.size}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {report.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Generator Modal */}
      <ReportGenerator 
        isOpen={showReportGenerator}
        onClose={() => setShowReportGenerator(false)}
      />

      {/* Excel Export Dialog */}
      <ExcelExportDialog
        isOpen={showExcelDialog}
        onClose={() => setShowExcelDialog(false)}
        entityType={selectedExcelEntity}
        filters={{}}
      />
    </div>
  )
}