'use client'

import { useCallback, useRef, useState, useEffect } from 'react'

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  minSwipeDistance?: number
  maxSwipeTime?: number
  preventDefaultTouchMove?: boolean
}

interface SwipeState {
  isSwipping: boolean
  startX: number
  startY: number
  startTime: number
}

export function useSwipeGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minSwipeDistance = 50,
  maxSwipeTime = 300,
  preventDefaultTouchMove = false
}: SwipeGestureOptions) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwipping: false,
    startX: 0,
    startY: 0,
    startTime: 0
  })

  const touchStartRef = useRef<HTMLElement | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return

    setSwipeState({
      isSwipping: true,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now()
    })
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefaultTouchMove && swipeState.isSwipping) {
      e.preventDefault()
    }
  }, [preventDefaultTouchMove, swipeState.isSwipping])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!swipeState.isSwipping) return

    const touch = e.changedTouches[0]
    if (!touch) return

    const endX = touch.clientX
    const endY = touch.clientY
    const endTime = Date.now()

    const deltaX = endX - swipeState.startX
    const deltaY = endY - swipeState.startY
    const deltaTime = endTime - swipeState.startTime

    // Reset swipe state
    setSwipeState(prev => ({ ...prev, isSwipping: false }))

    // Check if swipe is within time limit
    if (deltaTime > maxSwipeTime) return

    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // Determine if this is a horizontal or vertical swipe
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > minSwipeDistance) {
        if (deltaX > 0) {
          onSwipeRight?.()
        } else {
          onSwipeLeft?.()
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > minSwipeDistance) {
        if (deltaY > 0) {
          onSwipeDown?.()
        } else {
          onSwipeUp?.()
        }
      }
    }
  }, [swipeState, minSwipeDistance, maxSwipeTime, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  const attachListeners = useCallback((element: HTMLElement | null) => {
    if (touchStartRef.current) {
      // Remove old listeners
      touchStartRef.current.removeEventListener('touchstart', handleTouchStart as EventListener)
      touchStartRef.current.removeEventListener('touchmove', handleTouchMove as EventListener)
      touchStartRef.current.removeEventListener('touchend', handleTouchEnd as EventListener)
    }

    touchStartRef.current = element

    if (element) {
      // Add new listeners
      element.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true })
      element.addEventListener('touchmove', handleTouchMove as EventListener, { passive: !preventDefaultTouchMove })
      element.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true })
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefaultTouchMove])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (touchStartRef.current) {
        touchStartRef.current.removeEventListener('touchstart', handleTouchStart as EventListener)
        touchStartRef.current.removeEventListener('touchmove', handleTouchMove as EventListener)
        touchStartRef.current.removeEventListener('touchend', handleTouchEnd as EventListener)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    attachListeners,
    isSwipping: swipeState.isSwipping,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  }
}