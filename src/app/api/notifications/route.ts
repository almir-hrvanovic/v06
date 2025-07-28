import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { WebSocketNotification } from '@/lib/websocket'

// Mock notification store - in production, use database
const notificationStore = new Map<string, WebSocketNotification[]>()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const notifications = notificationStore.get(userId) || []
    
    // Sort by timestamp, newest first
    const sortedNotifications = notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return NextResponse.json(sortedNotifications)
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, message, userId, data } = body

    const notification: WebSocketNotification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      userId,
      data,
      timestamp: new Date(),
      read: false,
    }

    // Store notification
    const targetUserId = userId || session.user.id
    const existingNotifications = notificationStore.get(targetUserId) || []
    existingNotifications.unshift(notification)
    
    // Keep only last 100 notifications per user
    if (existingNotifications.length > 100) {
      existingNotifications.splice(100)
    }
    
    notificationStore.set(targetUserId, existingNotifications)

    // In a real implementation, you would:
    // 1. Save to database
    // 2. Broadcast via WebSocket to the target user
    // For now, we'll simulate this

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, read } = body

    const userId = session.user.id
    const notifications = notificationStore.get(userId) || []
    
    const notificationIndex = notifications.findIndex(n => n.id === id)
    if (notificationIndex !== -1) {
      notifications[notificationIndex].read = read
      notificationStore.set(userId, notifications)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}