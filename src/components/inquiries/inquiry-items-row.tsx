"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Eye,
  Edit,
  User,
  Package,
  UserPlus,
  Loader2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { formatWithSystemCurrency } from '@/lib/currency-helpers'
import { apiClient } from '@/lib/api-client'

interface InquiryItemsRowProps {
  inquiryId: string
  onAssignItem: (item: any) => void
}

export function InquiryItemsRow({ inquiryId, onAssignItem }: InquiryItemsRowProps) {
  const t = useTranslations()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const userRole = user?.role

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getInquiry(inquiryId)
        // Handle wrapped response format
        const inquiry = response.data || response
        setItems(inquiry.items || [])
      } catch (error) {
        console.error('Failed to load inquiry items:', error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    loadItems()
  }, [inquiryId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        {t('inquiries.items.noItems')}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-8">{t('inquiries.items.itemName')}</TableHead>
          <TableHead>{t('inquiries.items.quantity')}</TableHead>
          <TableHead>{t('inquiries.items.status')}</TableHead>
          <TableHead>{t('inquiries.items.assignedTo')}</TableHead>
          <TableHead>{t('inquiries.items.cost')}</TableHead>
          <TableHead>{t('inquiries.items.delivery')}</TableHead>
          <TableHead>{t('inquiries.items.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} className="hover:bg-muted/50 dark:hover:bg-muted/20">
            <TableCell className="pl-8">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{item.name}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {item.quantity} {item.unit}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">
                {item.status}
              </Badge>
            </TableCell>
            <TableCell>
              {item.assignedTo ? (
                <div className="flex items-center space-x-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{item.assignedTo.name}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">{t('inquiries.items.unassigned')}</span>
              )}
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {item.costCalculation ? 
                  formatWithSystemCurrency(Number(item.costCalculation.totalCost)) : 
                  <span className="text-muted-foreground">-</span>
                }
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {item.requestedDelivery ? 
                  formatDate(item.requestedDelivery) : 
                  <span className="text-muted-foreground">-</span>
                }
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/dashboard/items/${item.id}`)
                  }}
                  title={t('inquiries.items.viewItem')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {(userRole === 'VPP' || userRole === 'VP' || userRole === 'ADMIN' || userRole === 'SUPERUSER') && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dashboard/items/${item.id}/edit`)
                    }}
                    title={t('inquiries.items.editItem')}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {(userRole === 'VPP' || userRole === 'ADMIN' || userRole === 'SUPERUSER') && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAssignItem(item)
                    }}
                    title={t('inquiries.items.assignToVP')}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}