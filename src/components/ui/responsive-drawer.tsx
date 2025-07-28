'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { useDrawerGestures } from '@/hooks/use-drawer-gestures'

interface ResponsiveDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: 'left' | 'right'
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

export function ResponsiveDrawer({
  open,
  onOpenChange,
  side = 'left',
  title,
  description,
  children,
  className,
  showCloseButton = true
}: ResponsiveDrawerProps) {
  const { contentRef, dragOffset, isDragging } = useDrawerGestures({
    isOpen: open,
    onClose: () => onOpenChange(false),
    side
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={contentRef}
        side={side}
        className={cn(
          'overflow-y-auto',
          'focus:outline-none',
          // Smooth transitions when not dragging
          !isDragging && 'transition-transform duration-300 ease-out',
          className
        )}
        style={{
          transform: dragOffset ? `translateX(${dragOffset}px)` : undefined
        }}
        showCloseButton={showCloseButton}
        onEscapeKeyDown={(e) => {
          e.preventDefault()
          onOpenChange(false)
        }}
        onInteractOutside={(e) => {
          // Prevent closing on interaction with toast or other portals
          const target = e.target as HTMLElement
          if (target.closest('[data-sonner-toaster]')) {
            e.preventDefault()
            return
          }
          onOpenChange(false)
        }}
      >
        <SheetHeader>
          {title && <SheetTitle>{title}</SheetTitle>}
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}