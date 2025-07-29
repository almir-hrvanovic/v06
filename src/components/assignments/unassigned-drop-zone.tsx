'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { InquiryItemWithRelations } from '@/types'
import { DraggableItem } from './draggable-item'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface UnassignedDropZoneProps {
  items: InquiryItemWithRelations[]
  isOver?: boolean
}

export function UnassignedDropZone({ items, isOver }: UnassignedDropZoneProps) {
  const t = useTranslations()
  const { setNodeRef } = useDroppable({
    id: 'unassigned',
  })

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "w-[30%] border-r bg-card p-4 overflow-y-auto",
        isOver && "bg-primary/5"
      )}
    >
      <div className="mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          {t('assignments.unassignedItems')}
          <Badge>{items.length}</Badge>
        </h2>
      </div>
      
      <div 
        className={cn(
          "min-h-[400px] p-2 rounded-md border-2 border-dashed transition-colors",
          isOver ? "border-primary bg-primary/5" : "border-gray-200",
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
          <SortableContext 
            items={items.map(item => item.id)} 
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {items.map((item) => (
                <DraggableItem key={item.id} item={item} />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  )
}