"use client"

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface Attachment {
  id: string
  attachment: {
    id: string
    fileName: string
    originalName: string
    fileSize: number
    mimeType: string
    uploadThingUrl: string
    uploadedBy: {
      name: string
      email: string
    }
    createdAt: string
  }
}

interface UseAttachmentsProps {
  inquiryId?: string
  itemId?: string
}

export function useAttachments({ inquiryId, itemId }: UseAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttachments = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (inquiryId) params.append('inquiryId', inquiryId)
      if (itemId) params.append('itemId', itemId)

      const response = await fetch(`/api/attachments?${params.toString()}`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch attachments')
      }

      setAttachments(data.data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attachments'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [inquiryId, itemId])

  const linkAttachment = async (fileId: string) => {
    try {
      const response = await fetch('/api/attachments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fileId,
          inquiryId,
          itemId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link attachment')
      }

      toast.success(data.message)
      await fetchAttachments() // Refresh the list
      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to link attachment'
      toast.error(errorMessage)
      throw err
    }
  }

  const removeAttachment = async (attachmentId: string) => {
    try {
      const params = new URLSearchParams()
      params.append('attachmentId', attachmentId)
      if (inquiryId) params.append('inquiryId', inquiryId)
      if (itemId) params.append('itemId', itemId)

      const response = await fetch(`/api/attachments?${params.toString()}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove attachment')
      }

      toast.success(data.message)
      await fetchAttachments() // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove attachment'
      toast.error(errorMessage)
      throw err
    }
  }

  useEffect(() => {
    if (inquiryId || itemId) {
      fetchAttachments()
    }
  }, [inquiryId, itemId, fetchAttachments])

  return {
    attachments,
    loading,
    error,
    linkAttachment,
    removeAttachment,
    refetch: fetchAttachments,
  }
}