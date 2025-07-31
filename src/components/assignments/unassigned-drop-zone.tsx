'use client'

import { useDroppable } from '@dnd-kit/core'
import { Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { InquiryItemWithRelations } from '@/types'
import { DraggableItem } from './draggable-item'
import { CollapsibleInquiryGroup } from './collapsible-inquiry-group'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface UnassignedDropZoneProps {
  items: InquiryItemWithRelations[]
  isOver?: boolean
}

export function UnassignedDropZone({ items = [], isOver }: UnassignedDropZoneProps) {
  const t = useTranslations()
  const { setNodeRef } = useDroppable({
    id: 'unassigned',
  })

  // Group items by inquiry
  const itemsByInquiry = items.reduce((acc, item) => {
    const inquiryId = item.inquiryId
    if (!acc[inquiryId]) {
      acc[inquiryId] = {
        inquiry: item.inquiry,
        items: []
      }
    }
    acc[inquiryId].items.push(item)
    return acc
  }, {} as Record<string, { inquiry: any, items: InquiryItemWithRelations[] }>)

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "h-full border-r bg-card p-4 overflow-y-auto",
        isOver && "bg-primary/5"
      )}
    >
      <div 
        className={cn(
          "min-h-[400px] p-2 rounded-md transition-colors",
          isOver && "bg-primary/5",
          items.length === 0 && "flex items-center justify-center"
        )}
      >
        {items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t('assignments.noUnassignedItems')}</p>
            {isOver && (
              <p className="text-xs text-primary mt-2">{t('assignments.dropToUnassign')}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(itemsByInquiry).map(([inquiryId, group]) => (
              <CollapsibleInquiryGroup
                key={inquiryId}
                inquiryId={inquiryId}
                inquiryTitle={group.inquiry.title}
                customerName={group.inquiry.customer.name}
                items={group.items}
                priority={group.inquiry.priority}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}