'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Package, GripVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InquiryItemWithRelations, Priority } from '@/types'
import { DraggableItem } from './draggable-item'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface CollapsibleInquiryGroupProps {
  inquiryId: string
  inquiryTitle: string
  customerName: string
  items: InquiryItemWithRelations[]
  priority: Priority
  isDragging?: boolean
}

export function CollapsibleInquiryGroup({ 
  inquiryId, 
  inquiryTitle, 
  customerName,
  items,
  priority,
  isDragging = false
}: CollapsibleInquiryGroupProps) {
  const t = useTranslations()
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Make the group draggable with a special ID prefix
  const groupId = `group-${inquiryId}`
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: groupId,
    data: {
      type: 'group',
      inquiryId,
      itemIds: items.map(item => item.id)
    }
  })
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  // Get the most urgent priority from child items
  const getMostUrgentPriority = (): Priority => {
    const priorityOrder: Priority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW']
    
    // Start with inquiry priority
    let mostUrgent = priority
    
    // Check each item's priority
    items.forEach(item => {
      const itemPriority = item.inquiry.priority
      if (priorityOrder.indexOf(itemPriority) < priorityOrder.indexOf(mostUrgent)) {
        mostUrgent = itemPriority
      }
    })
    
    return mostUrgent
  }

  const effectivePriority = getMostUrgentPriority()

  const getPriorityBorderColor = (priority: Priority) => {
    switch (priority) {
      case 'URGENT':
        return 'border-l-red-500'
      case 'HIGH':
        return 'border-l-orange-500'
      case 'MEDIUM':
        return 'border-l-yellow-500'
      case 'LOW':
        return 'border-l-blue-500'
      default:
        return 'border-l-gray-400'
    }
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "mb-2",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-stretch bg-card rounded-md border overflow-hidden h-10">
        {/* Item count */}
        <div className="px-2 flex items-center justify-center">
          <span className="text-xs font-semibold">{items.length}</span>
        </div>
        
        {/* Priority color bar */}
        <div className={cn(
          "w-1",
          effectivePriority === 'URGENT' && "bg-red-500",
          effectivePriority === 'HIGH' && "bg-orange-500",
          effectivePriority === 'MEDIUM' && "bg-yellow-500",
          effectivePriority === 'LOW' && "bg-blue-500"
        )} />
        
        {/* Expand button with inquiry name */}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start px-2 py-1 h-full rounded-none overflow-hidden"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 w-full">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0" />
            )}
            <div className="flex-1 text-left min-w-0">
              <div className="font-medium text-xs truncate">{inquiryTitle}</div>
            </div>
          </div>
        </Button>
        
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing px-2 flex items-center hover:bg-accent border-l"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
      
      {isExpanded && (
        <div className="ml-6 mt-1">
          <div className="space-y-1">
            {items.map((item) => (
              <DraggableItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}