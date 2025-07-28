'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { User, UserRole } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, Plus, Pencil, Trash2, Shield, CheckCircle, XCircle, Key, Copy } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

export default function UsersPage() {
  const { data: session } = useSession()
  const t = useTranslations()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    email: string
    role: UserRole
  }>({
    name: '',
    email: '',
    role: UserRole.TECH
  })

  // Check if user has permission to manage users
  const canManageUsers = session?.user?.role && 
    (session.user.role === UserRole.SUPERUSER || session.user.role === UserRole.ADMIN)

  // Copy to clipboard utility
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('messages.success.changesSaved'), { duration: 2000 })
    } catch (error) {
      toast.error(t('messages.error.failedToSave'))
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast.error(t('messages.error.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(
        editingUser ? `/api/users/${editingUser.id}` : '/api/users',
        {
          method: editingUser ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save user')
      }

      const result = await response.json()
      
      if (editingUser) {
        toast.success(t('messages.success.userUpdated'))
        setShowEditDialog(false)
      } else {
        // Show temporary password for new users
        if (result.tempPassword) {
          toast.success(
            <div className="flex items-center gap-2">
              <span>{t('users.actions.userCreated')}: <strong>{result.tempPassword}</strong></span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(result.tempPassword, t('auth.signIn.password'))}
                className="h-6 px-2"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>,
            { duration: 15000 } // Show for 15 seconds
          )
        } else {
          toast.success(t('messages.success.userCreated'))
        }
        setShowCreateDialog(false)
      }
      
      fetchUsers()
      setEditingUser(null)
      setFormData({ name: '', email: '', role: UserRole.TECH })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('messages.error.failedToSave'))
    }
  }

  const handleCreateUser = () => {
    setEditingUser(null)
    setFormData({ name: '', email: '', role: UserRole.TECH })
    setShowCreateDialog(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role
    })
    setShowEditDialog(true)
  }

  const handleToggleActive = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user status')
      }

      toast.success(t('messages.success.userUpdated'))
      fetchUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('messages.error.failedToUpdate'))
    }
  }

  const handleResetPassword = async (user: User) => {
    if (!confirm(t('messages.confirmation.resetForm'))) {
      return
    }

    try {
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reset password')
      }
      
      const result = await response.json()
      
      if (result.tempPassword) {
        toast.success(
          <div className="flex items-center gap-2">
            <span>{t('users.actions.passwordResetFor', { userName: user.name || user.email })}: <strong>{result.tempPassword}</strong></span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(result.tempPassword, t('auth.passwordReset.newPassword'))}
              className="h-6 px-2"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>,
          { duration: 20000 } // Show for 20 seconds
        )
      } else {
        toast.success(t('messages.success.passwordReset'))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('messages.error.failedToUpdate'))
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleBadgeVariant = (role: UserRole) => {
    const variants: Record<UserRole, "default" | "secondary" | "outline" | "destructive"> = {
      [UserRole.SUPERUSER]: 'destructive',
      [UserRole.ADMIN]: 'destructive',
      [UserRole.MANAGER]: 'default',
      [UserRole.SALES]: 'secondary',
      [UserRole.VPP]: 'secondary',
      [UserRole.VP]: 'outline',
      [UserRole.TECH]: 'outline'
    }
    return variants[role]
  }

  const getRoleIcon = (role: UserRole) => {
    if (role === UserRole.SUPERUSER || role === UserRole.ADMIN) {
      return <Shield className="h-3 w-3" />
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pages.users.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('pages.users.userDetails')}
          </p>
        </div>
        {canManageUsers && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateUser}>
                <Plus className="mr-2 h-4 w-4" />
                {t('buttons.addUser')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingUser ? t('pages.users.editUser') : t('pages.users.createUser')}</DialogTitle>
                  <DialogDescription>
                    {editingUser ? t('pages.users.userDetails') : t('pages.users.createUser')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">{t('common.name')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t('common.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">{t('forms.labels.role')}</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(UserRole).map((role) => (
                          <SelectItem key={role} value={role}>
                            {t(`roles.${role.toLowerCase()}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingUser ? t('buttons.updateUser') : t('buttons.createUser')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('forms.placeholders.searchUsers')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('forms.placeholders.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')} {t('forms.labels.role')}</SelectItem>
                  {Object.values(UserRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredUsers.length} {t('navigation.users').toLowerCase()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('common.email')}</TableHead>
                <TableHead>{t('forms.labels.role')}</TableHead>
                <TableHead>{t('users.table.status')}</TableHead>
                <TableHead>{t('tables.headers.joined')}</TableHead>
                {canManageUsers && <TableHead className="text-right">{t('common.labels.actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || t('common.name')}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      <span className="flex items-center gap-1">
                        {getRoleIcon(user.role)}
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      <span className="flex items-center gap-1">
                        {user.isActive ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {user.isActive ? t('status.active') : t('status.inactive')}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  {canManageUsers && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              disabled={user.email === session?.user?.email}
                              title={t('users.actions.editUser')}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <form onSubmit={handleSubmit}>
                              <DialogHeader>
                                <DialogTitle>{editingUser ? t('users.form.edit.title') : t('users.form.create.title')}</DialogTitle>
                                <DialogDescription>
                                  {editingUser ? t('users.form.edit.subtitle') : t('users.form.create.subtitle')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-name">{t('users.form.fields.firstName')}</Label>
                                  <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-email">{t('users.form.fields.email')}</Label>
                                  <Input
                                    id="edit-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-role">{t('users.form.fields.role')}</Label>
                                  <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.values(UserRole).map((role) => (
                                        <SelectItem key={role} value={role}>
                                          {t(`roles.${role.toLowerCase()}`)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="submit">
                                  {editingUser ? t('users.actions.editUser') : t('users.actions.createUser')}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPassword(user)}
                          disabled={user.email === session?.user?.email}
                          title={t('users.actions.resetPassword')}
                        >
                          <Key className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(user)}
                          disabled={user.email === session?.user?.email}
                          title={user.isActive ? t('users.actions.deactivate') : t('users.actions.activate')}
                        >
                          {user.isActive ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('users.list.noUsers')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}