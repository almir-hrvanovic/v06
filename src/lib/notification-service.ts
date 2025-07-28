import { WebSocketNotification, NotificationType } from '@/lib/websocket'

class NotificationService {
  async createNotification(
    type: NotificationType,
    title: string,
    message: string,
    userId?: string,
    data?: any
  ): Promise<void> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          title,
          message,
          userId,
          data,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create notification')
      }
    } catch (error) {
      console.error('Failed to create notification:', error)
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          read: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Convenience methods for common notification types
  async notifyInquiryCreated(inquiryId: string, inquiryTitle: string, userId?: string) {
    await this.createNotification(
      'inquiry_created',
      'New Inquiry Created',
      `A new inquiry "${inquiryTitle}" has been created`,
      userId,
      { inquiryId }
    )
  }

  async notifyInquiryAssigned(inquiryId: string, inquiryTitle: string, assignedToUserId: string) {
    await this.createNotification(
      'inquiry_assigned',
      'Inquiry Assigned',
      `You have been assigned inquiry "${inquiryTitle}"`,
      assignedToUserId,
      { inquiryId }
    )
  }

  async notifyInquiryStatusChanged(
    inquiryId: string, 
    inquiryTitle: string, 
    oldStatus: string, 
    newStatus: string,
    userId?: string
  ) {
    await this.createNotification(
      'inquiry_status_changed',
      'Inquiry Status Updated',
      `Inquiry "${inquiryTitle}" status changed from ${oldStatus} to ${newStatus}`,
      userId,
      { inquiryId, oldStatus, newStatus }
    )
  }

  async notifyItemCosted(itemId: string, itemName: string, userId?: string) {
    await this.createNotification(
      'item_costed',
      'Item Costed',
      `Item "${itemName}" has been costed and is ready for review`,
      userId,
      { itemId }
    )
  }

  async notifyQuoteGenerated(quoteId: string, inquiryTitle: string, userId?: string) {
    await this.createNotification(
      'quote_generated',
      'Quote Generated',
      `A new quote has been generated for inquiry "${inquiryTitle}"`,
      userId,
      { quoteId }
    )
  }

  async notifySystemAlert(title: string, message: string, userId?: string) {
    await this.createNotification(
      'system_alert',
      title,
      message,
      userId
    )
  }
}

export const notificationService = new NotificationService()