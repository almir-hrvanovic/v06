'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { User as UserIcon, Package, CheckCircle2 } from 'lucide-react'
import { User, InquiryItemWithRelations } from '@/types'
import { DraggableItem } from './draggable-item'
import { cn } from '@/lib/utils'

interface UserDropZoneProps {
  user: User & {
    pendingCount?: number
    completedCount?: number
  }
  items: InquiryItemWithRelations[]
  isOver?: boolean
}

export function UserDropZone({ user, items = [], isOver }: UserDropZoneProps) {
  const { setNodeRef } = useDroppable({
    id: `user-${user.id}`,
  })

  const isVPP = user.role === 'VPP'

  return (
    <Card 
      ref={setNodeRef}
      className={cn(
        "h-full flex flex-col transition-shadow duration-200",
        "hover:shadow-md",
        isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5",
        isVPP && "border-t-2 border-t-primary/50"
      )}
    >
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="space-y-2">
          {/* User Info - Fixed height to prevent layout shift */}
          <div className="min-h-[40px] flex flex-col justify-start">
            <div className="flex items-start gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm break-words">{user.name}</span>
              </div>
            </div>
          </div>

          {/* Workload Indicators */}
          <div className="flex items-center gap-3">
            {/* Pending Items */}
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4 text-red-500" />
              <span className="text-lg font-bold text-red-500">
                {user.pendingCount || 0}
              </span>
            </div>

            {/* Completed Items */}
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span className="text-sm text-green-600">
                {user.completedCount || 0}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col">
        <div 
          className={cn(
            "flex-1 min-h-[100px] space-y-2 p-2 rounded-md transition-colors bg-muted/50",
            isOver && "bg-primary/20",
            items.length === 0 && "flex items-center justify-center"
          )}
        >
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Drop items here
            </p>
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
      </CardContent>
    </Card>
  )
}