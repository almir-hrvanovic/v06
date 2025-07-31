'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Package, Clock, Hash, User } from 'lucide-react'
import { InquiryItemWithRelations, Priority } from '@/types'
import { cn } from '@/lib/utils'

interface DraggableItemProps {
  item: InquiryItemWithRelations
  isDragging?: boolean
}

export function DraggableItem({ item, isDragging }: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getPriorityBadge = (priority: Priority) => {
    const priorityMap = {
      LOW: { variant: 'secondary' as const, className: 'text-gray-700' },
      MEDIUM: { variant: 'default' as const, className: 'text-yellow-700' },
      HIGH: { variant: 'destructive' as const, className: 'text-orange-700' },
      URGENT: { variant: 'destructive' as const, className: 'text-red-700 font-bold' },
    }
    const { variant, className } = priorityMap[priority]
    return <Badge variant={variant} className={className}>{priority}</Badge>
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card 
        className={cn(
          "cursor-move transition-shadow duration-200 hover:shadow-md",
          "border-l-4",
          item.inquiry.priority === 'URGENT' && "border-l-red-500",
          item.inquiry.priority === 'HIGH' && "border-l-orange-500",
          item.inquiry.priority === 'MEDIUM' && "border-l-yellow-500",
          item.inquiry.priority === 'LOW' && "border-l-gray-400",
          (isDragging || isSortableDragging) && "opacity-50 shadow-lg scale-105"
        )}
      >
        <div className="p-3 space-y-2 overflow-hidden">
          {/* Item Name */}
          <div className="font-medium text-sm break-words line-clamp-2" title={item.name}>
            {item.name}
          </div>

          {/* Customer and Inquiry */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="break-words line-clamp-1" title={item.inquiry.customer.name}>
              {item.inquiry.customer.name}
            </span>
          </div>

          {/* Quantity and Priority */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs">
              <Package className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{item.quantity}</span>
              {item.unit && <span className="text-muted-foreground">{item.unit}</span>}
            </div>
            {getPriorityBadge(item.inquiry.priority)}
          </div>

          {/* Created Date */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Inquiry Reference */}
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <Hash className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="break-words line-clamp-1" title={item.inquiry.title}>
              {item.inquiry.title}
            </span>
          </div>

          {/* Assigned To - Show when item is assigned */}
          {item.assignedTo && (
            <div className="flex items-start gap-1 text-xs bg-primary/10 text-primary rounded px-2 py-1 mt-1">
              <User className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span className="font-medium break-words">
                {item.assignedTo.name}
                {item.assignedTo.role === 'VPP' && ' (VPP)'}
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}