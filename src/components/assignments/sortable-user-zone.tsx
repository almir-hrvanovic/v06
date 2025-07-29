'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { UserDropZone } from './user-drop-zone'
import { User, InquiryItemWithRelations } from '@/types'

interface SortableUserZoneProps {
  user: User & {
    pendingCount?: number
    completedCount?: number
  }
  items: InquiryItemWithRelations[]
  isOver?: boolean
}

export function SortableUserZone({ user, items, isOver }: SortableUserZoneProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `user-${user.id}`,
    data: {
      type: 'user',
      user
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="relative group"
    >
      {/* Drag handle */}
      <div 
        className="absolute -top-3 left-1/2 -translate-x-1/2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-10"
        {...attributes}
        {...listeners}
      >
        <div className="bg-primary/10 hover:bg-primary/20 rounded-full p-1">
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-primary">
            <path 
              fill="currentColor" 
              d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
            />
          </svg>
        </div>
      </div>
      
      <UserDropZone 
        user={user} 
        items={items} 
        isOver={isOver}
      />
    </div>
  )
}