'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  FileText,
  Search,
  Download,
  Eye,
  Mail,
  Calendar,
  Building2,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface Quote {
  id: string
  inquiryId: string
  quoteNumber: string
  totalAmount: number
  validUntil: string
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  createdAt: string
  updatedAt: string
  inquiry: {
    id: string
    title: string
    customer: {
      id: string
      name: string
      email: string
    }
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
  _count?: {
    items: number
  }
}

export default function QuotesPage() {
  const t = useTranslations()
  const { user } = useAuth()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)

  const userRole = user?.role

  useEffect(() => {
    fetchQuotes()
  }, [searchTerm])

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/quotes?${params}`)
      if (!response.ok) throw new Error('Failed to fetch quotes')
      
      const data = await response.json()
      setQuotes(data)
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
      toast.error('Failed to load quotes')
    } finally {
      setLoading(false)
    }
  }

  const handleSendQuote = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/send`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to send quote')
      
      toast.success('Quote sent successfully')
      setSendDialogOpen(false)
      fetchQuotes()
    } catch (error) {
      console.error('Failed to send quote:', error)
      toast.error('Failed to send quote')
    }
  }

  const handleDownloadPDF = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/pdf/quote?quoteId=${quoteId}`)
      if (!response.ok) throw new Error('Failed to generate PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quote-${quoteId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Failed to download PDF:', error)
      toast.error('Failed to download PDF')
    }
  }

  const getStatusIcon = (status: Quote['status']) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="h-4 w-4" />
      case 'SENT':
        return <Send className="h-4 w-4" />
      case 'VIEWED':
        return <Eye className="h-4 w-4" />
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />
      case 'EXPIRED':
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: Quote['status']) => {
    const statusMap = {
      DRAFT: { variant: 'secondary' as const, label: 'Draft' },
      SENT: { variant: 'default' as const, label: 'Sent' },
      VIEWED: { variant: 'info' as const, label: 'Viewed' },
      ACCEPTED: { variant: 'success' as const, label: 'Accepted' },
      REJECTED: { variant: 'destructive' as const, label: 'Rejected' },
      EXPIRED: { variant: 'warning' as const, label: 'Expired' }
    }

    const { variant, label } = statusMap[status]
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        <span>{label}</span>
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
            <p className="text-muted-foreground">
              Manage and track customer quotes
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading quotes...</div>
        </div>
      </div>
    )
  }

  // Only show to authorized roles
  if (!['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES'].includes(userRole || '')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground">
            Manage and track customer quotes
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes.filter(q => q.status === 'DRAFT').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes.filter(q => q.status === 'SENT').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes.filter(q => q.status === 'ACCEPTED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(quotes.reduce((sum, q) => sum + q.totalAmount, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t("forms.placeholders.searchQuotes")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quote List</CardTitle>
          <CardDescription>
            {quotes.length} quotes found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Inquiry</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">
                      {quote.quoteNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{quote.inquiry.customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {quote.inquiry.customer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate">
                        {quote.inquiry.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(quote.totalAmount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(quote.validUntil)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(quote.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(quote.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {quote.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedQuote(quote)
                              setSendDialogOpen(true)
                            }}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {quotes.length === 0 && (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t("emptyStates.noQuotesFound")}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Quotes will appear here once generated from approved inquiries'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Quote Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quote</DialogTitle>
            <DialogDescription>
              Send this quote to {selectedQuote?.inquiry.customer.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm">
                The quote will be sent to: <strong>{selectedQuote?.inquiry.customer.email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Quote Number: {selectedQuote?.quoteNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                Amount: {selectedQuote && formatCurrency(selectedQuote.totalAmount)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedQuote && handleSendQuote(selectedQuote.id)}>
              <Mail className="mr-2 h-4 w-4" />
              Send Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}