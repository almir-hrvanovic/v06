"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Eye,
  Edit,
  Calendar,
  User,
  Building2,
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp,
  UserPlus
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { InquiryWithRelations } from '@/types'
import { AssignItemDialog } from '@/components/inquiries/assign-item-dialog'

interface MobileTableProps {
  inquiries: InquiryWithRelations[]
  isLoading?: boolean
  onEdit?: (id: string) => void
  onView?: (id: string) => void
}

export function MobileTable({ 
  inquiries, 
  isLoading = false, 
  onEdit, 
  onView 
}: MobileTableProps) {
  const t = useTranslations()
  const { data: session } = useSession()
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  
  const userRole = session?.user?.role

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCards(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: any, label: string } } = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      SUBMITTED: { variant: 'warning', label: 'Submitted' },
      IN_REVIEW: { variant: 'info', label: 'In Review' },
      ASSIGNED: { variant: 'info', label: t("common.status.assigned") },
      COSTING: { variant: 'warning', label: 'Costing' },
      QUOTED: { variant: 'success', label: 'Quoted' },
      APPROVED: { variant: 'success', label: t("common.status.approved") },
      REJECTED: { variant: 'destructive', label: 'Rejected' },
      CONVERTED: { variant: 'success', label: 'Converted' },
    }

    const mappedStatus = statusMap[status] || { variant: 'secondary', label: status }
    return <Badge variant={mappedStatus.variant}>{mappedStatus.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap: { [key: string]: { variant: any, label: string } } = {
      LOW: { variant: 'secondary', label: t("common.priority.low") },
      MEDIUM: { variant: 'warning', label: t("common.priority.medium") },
      HIGH: { variant: 'destructive', label: t("common.priority.high") },
      URGENT: { variant: 'destructive', label: t("common.priority.urgent") },
    }

    const mappedPriority = priorityMap[priority] || { variant: 'secondary', label: priority }
    return <Badge variant={mappedPriority.variant}>{mappedPriority.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (inquiries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>{t("emptyStates.noInquiriesFound")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {inquiries.map((inquiry) => {
        const isExpanded = expandedCards.has(inquiry.id)
        
        return (
          <Card key={inquiry.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-medium truncate mb-1">
                    {inquiry.title}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusBadge(inquiry.status)}
                    {getPriorityBadge(inquiry.priority)}
                  </div>
                  <CardDescription className="text-xs">
                    ID: {inquiry.id.slice(-8)} • Created {formatDate(inquiry.createdAt)}
                  </CardDescription>
                </div>
                
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleExpanded(inquiry.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/inquiries/${inquiry.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/inquiries/${inquiry.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Always visible summary */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{inquiry.customer.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="font-medium">
                    {formatCurrency(inquiry.totalValue?.toNumber() || 0)}
                  </span>
                </div>
              </div>

              {/* Expandable items */}
              {isExpanded && inquiry.items && inquiry.items.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Items ({inquiry.items.length})
                  </h4>
                  {inquiry.items.map((item: any, index: number) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{item.name}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {item.quantity} {item.unit || 'units'}
                            </span>
                            <span className="text-xs">•</span>
                            <Badge variant="outline" className="text-xs">
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Assigned to:</span>
                          <p className="font-medium">
                            {item.assignedTo ? item.assignedTo.name : 'Unassigned'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cost:</span>
                          <p className="font-medium">
                            {item.costCalculation 
                              ? formatCurrency(item.costCalculation.totalCost)
                              : 'Not calculated'
                            }
                          </p>
                        </div>
                      </div>
                      
                      {item.description && (
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex gap-1 pt-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                          <Link href={`/dashboard/items/${item.id}`}>
                            <Eye className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                          <Link href={`/dashboard/items/${item.id}/edit`}>
                            <Edit className="h-3 w-3" />
                          </Link>
                        </Button>
                        {(userRole === 'VPP' || userRole === 'ADMIN' || userRole === 'SUPERUSER') && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2"
                            onClick={() => {
                              setSelectedItem(item)
                              setAssignDialogOpen(true)
                            }}
                            title={t("actions.assignToVP")}
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
      
      {/* Assign Item Dialog */}
      {selectedItem && (
        <AssignItemDialog
          isOpen={assignDialogOpen}
          onClose={() => {
            setAssignDialogOpen(false)
            setSelectedItem(null)
          }}
          item={selectedItem}
          onAssigned={() => {
            // Refresh data if needed
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}