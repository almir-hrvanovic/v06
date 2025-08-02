"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { wsManager, WebSocketNotification } from '@/lib/websocket'
import { toast } from 'sonner'

interface NotificationContextType {
  notifications: WebSocketNotification[]
  unreadCount: number
  addNotification: (notification: WebSocketNotification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  isConnected: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const addNotification = useCallback((notification: WebSocketNotification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep only last 50 notifications
    
    // Show toast notification
    toast(notification.title, {
      description: notification.message,
      duration: 5000,
    })
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (!user?.id) return

    // WebSocket event handlers
    const handleConnected = () => {
      setIsConnected(true)
      console.log('Notification system connected')
    }

    const handleDisconnected = () => {
      setIsConnected(false)
      console.log('Notification system disconnected')
    }

    const handleNotification = (notification: WebSocketNotification) => {
      addNotification(notification)
    }

    const handleError = (error: any) => {
      // Silently handle errors since WebSocket is optional
      // console.error('Notification system error:', error)
      setIsConnected(false)
    }

    // Register event listeners
    wsManager.on('connected', handleConnected)
    wsManager.on('disconnected', handleDisconnected)
    wsManager.on('notification', handleNotification)
    wsManager.on('error', handleError)

    // Connect to WebSocket (with error handling)
    try {
      wsManager.connect(user.id)
    } catch (error) {
      console.log('WebSocket connection skipped - running without real-time notifications')
    }

    // Cleanup on unmount
    return () => {
      wsManager.off('connected', handleConnected)
      wsManager.off('disconnected', handleDisconnected)
      wsManager.off('notification', handleNotification)
      wsManager.off('error', handleError)
      wsManager.disconnect()
    }
  }, [user?.id, addNotification])

  // Load existing notifications on mount
  useEffect(() => {
    if (!user?.id) return

    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data = await response.json()
          setNotifications(data)
        }
      } catch (error) {
        console.error('Failed to load notifications:', error)
      }
    }

    loadNotifications()
  }, [user?.id])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        isConnected,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}