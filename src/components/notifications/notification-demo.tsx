"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useNotifications } from '@/contexts/notification-context'
import { NotificationType } from '@/lib/websocket'
import { Bell, Send } from 'lucide-react'

export function NotificationDemo() {
  const { addNotification } = useNotifications()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<NotificationType>('system_alert')

  const handleSendNotification = () => {
    if (!title.trim() || !message.trim()) return

    const notification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: title.trim(),
      message: message.trim(),
      timestamp: new Date(),
      read: false,
    }

    addNotification(notification)
    setTitle('')
    setMessage('')
  }

  const sendSampleNotifications = () => {
    const samples = [
      {
        type: 'inquiry_created' as NotificationType,
        title: 'New Inquiry Created',
        message: 'Inquiry "Custom Manufacturing Request" has been submitted and requires review',
      },
      {
        type: 'inquiry_assigned' as NotificationType,
        title: 'Inquiry Assigned',
        message: 'You have been assigned inquiry "Product Development Quote"',
      },
      {
        type: 'item_costed' as NotificationType,
        title: 'Item Costed',
        message: 'Item "Steel Frame Assembly" has been costed and is ready for review',
      },
      {
        type: 'quote_generated' as NotificationType,
        title: 'Quote Generated',
        message: 'Quote QUO-2024-156 has been generated for "Industrial Equipment"',
      },
    ]

    samples.forEach((sample, index) => {
      setTimeout(() => {
        const notification = {
          id: Math.random().toString(36).substr(2, 9),
          ...sample,
          timestamp: new Date(),
          read: false,
        }
        addNotification(notification)
      }, index * 1000)
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Notification Demo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(value) => setType(value as NotificationType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inquiry_created">Inquiry Created</SelectItem>
              <SelectItem value="inquiry_assigned">Inquiry Assigned</SelectItem>
              <SelectItem value="inquiry_status_changed">Status Changed</SelectItem>
              <SelectItem value="item_costed">Item Costed</SelectItem>
              <SelectItem value="quote_generated">Quote Generated</SelectItem>
              <SelectItem value="system_alert">System Alert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Notification message..."
            rows={3}
          />
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={handleSendNotification}
            disabled={!title.trim() || !message.trim()}
            className="flex-1"
          >
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
          <Button 
            onClick={sendSampleNotifications}
            variant="outline"
          >
            Send Samples
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}