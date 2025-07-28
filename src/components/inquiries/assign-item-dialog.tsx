"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AssignItemDialogProps {
  isOpen: boolean
  onClose: () => void
  item: {
    id: string
    name: string
    assignedTo?: {
      id: string
      name: string
    } | null
  }
  onAssigned?: () => void
}

export function AssignItemDialog({ isOpen, onClose, item, onAssigned }: AssignItemDialogProps) {
  const t = useTranslations('toasts.assignments')
  const tButtons = useTranslations('buttons')
  const tPlaceholders = useTranslations('placeholders.filters')
  const [loading, setLoading] = useState(false)
  const [vpUsers, setVpUsers] = useState<User[]>([])
  const [selectedVpId, setSelectedVpId] = useState(item.assignedTo?.id || '')

  useEffect(() => {
    if (isOpen) {
      fetchVpUsers()
    }
  }, [isOpen])

  const fetchVpUsers = async () => {
    try {
      // Fetch both VP and VPP users
      const [vpResponse, vppResponse] = await Promise.all([
        fetch('/api/users?role=VP'),
        fetch('/api/users?role=VPP')
      ])
      
      if (vpResponse.ok && vppResponse.ok) {
        const vpData = await vpResponse.json()
        const vppData = await vppResponse.json()
        // Combine and sort by name
        const allUsers = [...(vpData || []), ...(vppData || [])]
        allUsers.sort((a, b) => a.name.localeCompare(b.name))
        setVpUsers(allUsers)
      }
    } catch (error) {
      console.error('Failed to fetch VP/VPP users:', error)
    }
  }

  const handleAssign = async () => {
    if (!selectedVpId) {
      toast.error(t('selectVpError'))
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.assignItems({
        itemIds: [item.id],
        assigneeId: selectedVpId
      })
      
      console.log('Assignment response:', response)

      toast.success(t('assignSuccess'))

      // Small delay to ensure database transaction completes
      setTimeout(() => {
        onAssigned?.()
        onClose()
      }, 500)
    } catch (error) {
      console.error('Failed to assign item:', error)
      toast.error(t('assignError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Item</DialogTitle>
          <DialogDescription>
            Assign "{item.name}" to a VP or VPP for cost calculation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="vp-select">Select VP/VPP</Label>
            <Select
              value={selectedVpId}
              onValueChange={setSelectedVpId}
            >
              <SelectTrigger id="vp-select">
                <SelectValue placeholder={tButtons('chooseVp')} />
              </SelectTrigger>
              <SelectContent>
                {vpUsers.map((vp) => (
                  <SelectItem key={vp.id} value={vp.id}>
                    {vp.name} ({vp.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {item.assignedTo && (
            <div className="text-sm text-muted-foreground">
              Currently assigned to: {item.assignedTo.name}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={loading || !selectedVpId}>
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}