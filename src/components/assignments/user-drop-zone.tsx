'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { User as UserIcon, Package, CheckCircle2, AlertTriangle } from 'lucide-react'
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
  averagePending?: number
}

export function UserDropZone({ user, items = [], isOver, averagePending = 0 }: UserDropZoneProps) {
  const { setNodeRef } = useDroppable({
    id: `user-${user.id}`,
  })

  const isVPP = user.role === 'VPP'
  const pendingCount = user.pendingCount || 0
  const isOverloaded = averagePending > 0 && pendingCount > averagePending * 1.5

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
                {isVPP && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    VPP
                  </span>
                )}
              </div>
              {isOverloaded && (
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Workload Indicators */}
          <div className="flex items-center gap-3">
            {/* Pending Items */}
            <div className={cn(
              "flex items-center gap-1",
              isOverloaded && "animate-pulse"
            )}>
              <Package className={cn(
                "h-4 w-4",
                isOverloaded ? "text-destructive" : "text-red-500"
              )} />
              <span className={cn(
                "text-lg font-bold",
                isOverloaded ? "text-destructive" : "text-red-500"
              )}>
                {pendingCount}
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