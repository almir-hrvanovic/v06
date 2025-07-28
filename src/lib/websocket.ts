"use client"

import { EventEmitter } from 'events'

export type NotificationType = 
  | 'inquiry_created'
  | 'inquiry_assigned'
  | 'inquiry_status_changed'
  | 'item_costed'
  | 'quote_generated'
  | 'system_alert'

export interface WebSocketNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  userId?: string
  data?: any
  timestamp: Date
  read: boolean
}

class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 0 // Disable reconnection attempts
  private reconnectDelay = 1000
  private userId: string | null = null
  private isConnecting = false

  connect(userId: string) {
    // WebSocket server not implemented yet - using fallback notifications
    // console.log('WebSocket connection disabled - server not implemented')
    return
    
    /* Commented out until WebSocket server is implemented
    if (this.isConnecting || (this.ws && this.ws!.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true
    this.userId = userId

    try {
      // Use secure WebSocket in production, regular in development
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/ws?userId=${userId}`
      
      this.ws = new WebSocket(wsUrl)

      this.ws!.onopen = () => {
        console.log('WebSocket connected')
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.emit('connected')
      }

      this.ws!.onmessage = (event) => {
        try {
          const notification: WebSocketNotification = JSON.parse(event.data)
          this.emit('notification', notification)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws!.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        this.isConnecting = false
        this.emit('disconnected')
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }

      this.ws!.onerror = (error) => {
        // Silently handle WebSocket errors since we don't have a real WS server
        // console.error('WebSocket error:', error)
        this.isConnecting = false
        // Don't emit error to avoid UI notifications
        // this.emit('error', error)
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
    */
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId)
      }
    }, delay)
  }

  disconnect() {
    if (this.ws) {
      this.ws!.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.userId = null
    this.reconnectAttempts = 0
  }

  send(data: any) {
    if (this.ws && this.ws!.readyState === WebSocket.OPEN) {
      this.ws!.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instance
export const wsManager = new WebSocketManager()