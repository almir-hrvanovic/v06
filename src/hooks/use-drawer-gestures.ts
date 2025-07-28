'use client'

import { useEffect, useRef, useState } from 'react'

interface UseDrawerGesturesProps {
  isOpen: boolean
  onClose: () => void
  side?: 'left' | 'right' | 'top' | 'bottom'
  threshold?: number
}

export function useDrawerGestures({
  isOpen,
  onClose,
  side = 'left',
  threshold = 100
}: UseDrawerGesturesProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const startX = useRef(0)
  const startY = useRef(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !contentRef.current) return

    const content = contentRef.current
    let animationId: number

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      startX.current = touch.clientX
      startY.current = touch.clientY
      setIsDragging(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - startX.current
      const deltaY = touch.clientY - startY.current

      // Determine if this is a horizontal or vertical swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault()

        if (side === 'left' && deltaX < 0) {
          setDragOffset(Math.max(deltaX, -content.offsetWidth))
        } else if (side === 'right' && deltaX > 0) {
          setDragOffset(Math.min(deltaX, content.offsetWidth))
        }
      }
    }

    const handleTouchEnd = () => {
      if (!isDragging) return

      setIsDragging(false)

      // Close if dragged past threshold
      if (Math.abs(dragOffset) > threshold) {
        onClose()
      }

      // Animate back to original position
      const animate = () => {
        setDragOffset((prev) => {
          const next = prev * 0.8
          if (Math.abs(next) < 1) {
            return 0
          }
          animationId = requestAnimationFrame(animate)
          return next
        })
      }
      animate()
    }

    content.addEventListener('touchstart', handleTouchStart, { passive: true })
    content.addEventListener('touchmove', handleTouchMove, { passive: false })
    content.addEventListener('touchend', handleTouchEnd)

    return () => {
      content.removeEventListener('touchstart', handleTouchStart)
      content.removeEventListener('touchmove', handleTouchMove)
      content.removeEventListener('touchend', handleTouchEnd)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isOpen, isDragging, dragOffset, onClose, side, threshold])

  return {
    contentRef,
    dragOffset,
    isDragging
  }
}