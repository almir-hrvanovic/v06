'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Loader2, Save, AlertCircle, Settings, DollarSign, RefreshCw, X, HardDrive, Cloud } from 'lucide-react'
import { Currency, StorageProvider } from '@prisma/client'
import { formatDate } from '@/lib/utils'

interface SystemSettings {
  id: string
  mainCurrency: Currency
  additionalCurrency1: Currency | null
  additionalCurrency2: Currency | null
  exchangeRate1: number | null
  exchangeRate2: number | null
  // File Storage Settings
  storageProvider: StorageProvider
  uploadThingToken: string | null
  uploadThingAppId: string | null
  localStoragePath: string | null
  maxFileSize: number
  allowedFileTypes: string[]
  updatedAt: string
  updatedBy: {
    name: string
    email: string
  } | null
}

const currencySymbols: Record<Currency, string> = {
  EUR: '€',
  BAM: 'KM',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  HRK: 'kn',
  RSD: 'дин'
}

const currencyNames: Record<Currency, string> = {
  EUR: 'Euro',
  BAM: 'Convertible Mark',
  USD: 'US Dollar',
  GBP: 'British Pound',
  CHF: 'Swiss Franc',
  HRK: 'Croatian Kuna',
  RSD: 'Serbian Dinar'
}

export default function SystemSettingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const t = useTranslations()
  
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'currency' | 'storage'>('currency')
  
  const [formData, setFormData] = useState({
    mainCurrency: Currency.EUR as Currency,
    additionalCurrency1: null as Currency | null | 'none',
    additionalCurrency2: null as Currency | null | 'none',
    exchangeRate1: '',
    exchangeRate2: '',
    // File Storage Settings
    storageProvider: StorageProvider.UPLOADTHING as StorageProvider,
    uploadThingToken: '',
    uploadThingAppId: '',
    localStoragePath: './uploads',
    maxFileSize: 16777216, // 16MB
    allowedFileTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  })

  useEffect(() => {
    if (isLoading) return
    
    if (!user || user.role !== 'SUPERUSER') {
      router.push('/dashboard')
      return
    }
    
    fetchSettings()
  }, [user, isLoading, router])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/system-settings')
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }
      
      const data = await response.json()
      setSettings(data)
      
      // Initialize form with current settings
      setFormData({
        mainCurrency: data.mainCurrency,
        additionalCurrency1: data.additionalCurrency1 || 'none',
        additionalCurrency2: data.additionalCurrency2 || 'none',
        exchangeRate1: data.exchangeRate1?.toString() || '',
        exchangeRate2: data.exchangeRate2?.toString() || '',
        // File Storage Settings
        storageProvider: data.storageProvider || StorageProvider.UPLOADTHING,
        uploadThingToken: data.uploadThingToken || '',
        uploadThingAppId: data.uploadThingAppId || '',
        localStoragePath: data.localStoragePath || './uploads',
        maxFileSize: data.maxFileSize || 16777216,
        allowedFileTypes: data.allowedFileTypes || ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      })
      
      // Preserve the active tab if it was set (e.g., from URL or previous state)
      // This helps when returning to the page
    } catch (error) {
      console.error('Failed to fetch system settings:', error)
      toast.error('Failed to load system settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      
      let payload: any = {}
      
      // Only include data from the active tab
      if (activeTab === 'currency') {
        payload = {
          mainCurrency: formData.mainCurrency,
          additionalCurrency1: formData.additionalCurrency1 === 'none' ? null : formData.additionalCurrency1,
          additionalCurrency2: formData.additionalCurrency2 === 'none' ? null : formData.additionalCurrency2,
          exchangeRate1: formData.additionalCurrency1 && formData.additionalCurrency1 !== 'none' && formData.exchangeRate1 
            ? parseFloat(formData.exchangeRate1) 
            : null,
          exchangeRate2: formData.additionalCurrency2 && formData.additionalCurrency2 !== 'none' && formData.exchangeRate2 
            ? parseFloat(formData.exchangeRate2) 
            : null,
        }
      } else if (activeTab === 'storage') {
        payload = {
          storageProvider: formData.storageProvider,
          uploadThingToken: formData.uploadThingToken || null,
          uploadThingAppId: formData.uploadThingAppId || null,
          localStoragePath: formData.localStoragePath || './uploads',
          maxFileSize: formData.maxFileSize,
          allowedFileTypes: formData.allowedFileTypes
        }
      }
      
      console.log('Sending payload for tab:', activeTab, payload)
      
      const response = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error('API Error Response:', error)
        if (error.details) {
          console.error('Validation errors:', error.details)
        }
        throw new Error(error.error || 'Failed to update settings')
      }
      
      const updatedSettings = await response.json()
      setSettings(updatedSettings)
      
      // Update form data with the returned values to ensure consistency
      setFormData(prev => ({
        ...prev,
        mainCurrency: updatedSettings.mainCurrency,
        additionalCurrency1: updatedSettings.additionalCurrency1 || 'none',
        additionalCurrency2: updatedSettings.additionalCurrency2 || 'none',
        exchangeRate1: updatedSettings.exchangeRate1?.toString() || '',
        exchangeRate2: updatedSettings.exchangeRate2?.toString() || '',
        storageProvider: updatedSettings.storageProvider || StorageProvider.UPLOADTHING,
        uploadThingToken: updatedSettings.uploadThingToken || '',
        uploadThingAppId: updatedSettings.uploadThingAppId || '',
        localStoragePath: updatedSettings.localStoragePath || './uploads',
        maxFileSize: updatedSettings.maxFileSize || 16777216,
        allowedFileTypes: updatedSettings.allowedFileTypes || ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      }))
      
      setShowConfirmDialog(false)
      toast.success(`${activeTab === 'currency' ? 'Currency' : 'Storage'} settings updated successfully`)
    } catch (error: any) {
      console.error('Failed to update system settings:', error)
      toast.error(error.message || 'Failed to update system settings')
    } finally {
      setSaving(false)
    }
  }

  const validateForm = () => {
    // Check if additional currency has exchange rate (only if currency is not 'none')
    if (formData.additionalCurrency1 && formData.additionalCurrency1 !== 'none' && !formData.exchangeRate1) {
      toast.error('Exchange rate is required for additional currency 1')
      return false
    }
    
    if (formData.additionalCurrency2 && formData.additionalCurrency2 !== 'none' && !formData.exchangeRate2) {
      toast.error('Exchange rate is required for additional currency 2')
      return false
    }
    
    // Check if currencies are unique (only if not 'none')
    if (formData.additionalCurrency1 && formData.additionalCurrency1 !== 'none' && formData.additionalCurrency1 === formData.mainCurrency) {
      toast.error('Additional currency 1 cannot be the same as main currency')
      return false
    }
    
    if (formData.additionalCurrency2 && formData.additionalCurrency2 !== 'none' && formData.additionalCurrency2 === formData.mainCurrency) {
      toast.error('Additional currency 2 cannot be the same as main currency')
      return false
    }
    
    if (formData.additionalCurrency1 && formData.additionalCurrency1 !== 'none' && 
        formData.additionalCurrency2 && formData.additionalCurrency2 !== 'none' && 
        formData.additionalCurrency1 === formData.additionalCurrency2) {
      toast.error('Additional currencies must be different')
      return false
    }
    
    return true
  }
  
  const validateStorageSettings = () => {
    // Validate UploadThing settings
    if (formData.storageProvider === StorageProvider.UPLOADTHING) {
      if (!formData.uploadThingToken || !formData.uploadThingToken.trim()) {
        toast.error('UploadThing token is required for cloud storage')
        return false
      }
      
      if (!formData.uploadThingAppId || !formData.uploadThingAppId.trim()) {
        toast.error('UploadThing App ID is required for cloud storage')
        return false
      }
    }
    
    // Validate local storage settings
    if (formData.storageProvider === StorageProvider.LOCAL) {
      if (!formData.localStoragePath || !formData.localStoragePath.trim()) {
        toast.error('Local storage path is required')
        return false
      }
    }
    
    // Validate file size
    if (formData.maxFileSize < 1048576) { // 1MB minimum
      toast.error('Maximum file size must be at least 1MB')
      return false
    }
    
    if (formData.maxFileSize > 104857600) { // 100MB maximum
      toast.error('Maximum file size cannot exceed 100MB')
      return false
    }
    
    // Validate file types
    if (formData.allowedFileTypes.length === 0) {
      toast.error('At least one file type must be allowed')
      return false
    }
    
    return true
  }

  const handleSaveClick = () => {
    if (activeTab === 'currency' && validateForm()) {
      setShowConfirmDialog(true)
    } else if (activeTab === 'storage' && validateStorageSettings()) {
      setShowConfirmDialog(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (user?.role !== 'SUPERUSER') {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure global currency settings for the application
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard')}
          className="rounded-full"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      <Tabs value={activeTab} className="space-y-4" onValueChange={(value) => setActiveTab(value as 'currency' | 'storage')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="currency" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Currency Settings
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            File Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="currency" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Changing currency settings will affect all calculations and displays throughout the system. 
              Make sure exchange rates are accurate before saving.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Currency Configuration
              </CardTitle>
              <CardDescription>
                Set the main currency and optional additional currencies with exchange rates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
          {/* Main Currency */}
          <div className="space-y-2">
            <Label htmlFor="mainCurrency">Main Currency (Required)</Label>
            <Select
              value={formData.mainCurrency}
              onValueChange={(value) => setFormData({ ...formData, mainCurrency: value as Currency })}
            >
              <SelectTrigger id="mainCurrency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Currency).map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currencySymbols[currency]} - {currencyNames[currency]} ({currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This currency will be used for all calculations and reports
            </p>
          </div>

          {/* Additional Currency 1 */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium">Additional Currency 1 (Optional)</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="additionalCurrency1">Currency</Label>
                <Select
                  value={formData.additionalCurrency1 || 'none'}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    additionalCurrency1: value === 'none' ? null : value as Currency,
                    // Clear exchange rate when currency is set to none
                    exchangeRate1: value === 'none' ? '' : formData.exchangeRate1
                  })}
                >
                  <SelectTrigger id="additionalCurrency1">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {Object.values(Currency)
                      .filter(c => c !== formData.mainCurrency && c !== formData.additionalCurrency2)
                      .map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currencySymbols[currency]} - {currencyNames[currency]} ({currency})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exchangeRate1">
                  Exchange Rate to {formData.mainCurrency}
                </Label>
                <div className="relative">
                  <Input
                    id="exchangeRate1"
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="e.g. 1.95583"
                    value={formData.exchangeRate1}
                    onChange={(e) => setFormData({ ...formData, exchangeRate1: e.target.value })}
                    disabled={!formData.additionalCurrency1}
                  />
                  {formData.additionalCurrency1 && formData.exchangeRate1 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      1 {formData.additionalCurrency1} = {formData.exchangeRate1} {formData.mainCurrency}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Currency 2 */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium">Additional Currency 2 (Optional)</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="additionalCurrency2">Currency</Label>
                <Select
                  value={formData.additionalCurrency2 || 'none'}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    additionalCurrency2: value === 'none' ? null : value as Currency,
                    // Clear exchange rate when currency is set to none
                    exchangeRate2: value === 'none' ? '' : formData.exchangeRate2
                  })}
                >
                  <SelectTrigger id="additionalCurrency2">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {Object.values(Currency)
                      .filter(c => c !== formData.mainCurrency && c !== formData.additionalCurrency1)
                      .map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currencySymbols[currency]} - {currencyNames[currency]} ({currency})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exchangeRate2">
                  Exchange Rate to {formData.mainCurrency}
                </Label>
                <div className="relative">
                  <Input
                    id="exchangeRate2"
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="e.g. 0.85"
                    value={formData.exchangeRate2}
                    onChange={(e) => setFormData({ ...formData, exchangeRate2: e.target.value })}
                    disabled={!formData.additionalCurrency2}
                  />
                  {formData.additionalCurrency2 && formData.exchangeRate2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      1 {formData.additionalCurrency2} = {formData.exchangeRate2} {formData.mainCurrency}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Last Updated Info */}
          {settings?.updatedBy && (
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Last updated: {formatDate(settings.updatedAt)}
              </span>
              <span>
                By: {settings.updatedBy.name} ({settings.updatedBy.email})
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveClick}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Configure how files are stored in your application. Choose between cloud storage (UploadThing) or local file system storage.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                File Storage Configuration
              </CardTitle>
              <CardDescription>
                Choose your preferred file storage method and configure the settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Storage Provider Selection */}
              <div className="space-y-2">
                <Label htmlFor="storageProvider">Storage Provider</Label>
                <Select
                  value={formData.storageProvider}
                  onValueChange={(value) => setFormData({ ...formData, storageProvider: value as StorageProvider })}
                >
                  <SelectTrigger id="storageProvider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={StorageProvider.UPLOADTHING}>
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        UploadThing (Cloud Storage)
                      </div>
                    </SelectItem>
                    <SelectItem value={StorageProvider.LOCAL}>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        Local File System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* UploadThing Settings */}
              {formData.storageProvider === StorageProvider.UPLOADTHING && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium">UploadThing Configuration</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="uploadThingToken">UploadThing Token</Label>
                      <Textarea
                        id="uploadThingToken"
                        value={formData.uploadThingToken}
                        onChange={(e) => setFormData({ ...formData, uploadThingToken: e.target.value })}
                        placeholder="Paste your UploadThing token here..."
                        className="font-mono text-sm"
                        rows={3}
                      />
                      <p className="text-sm text-muted-foreground">
                        Get your token from the UploadThing dashboard
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="uploadThingAppId">App ID</Label>
                      <Input
                        id="uploadThingAppId"
                        value={formData.uploadThingAppId}
                        onChange={(e) => setFormData({ ...formData, uploadThingAppId: e.target.value })}
                        placeholder="e.g., r7x7odob52"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Local Storage Settings */}
              {formData.storageProvider === StorageProvider.LOCAL && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium">Local Storage Configuration</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="localStoragePath">Storage Path</Label>
                      <Input
                        id="localStoragePath"
                        value={formData.localStoragePath}
                        onChange={(e) => setFormData({ ...formData, localStoragePath: e.target.value })}
                        placeholder="./uploads"
                      />
                      <p className="text-sm text-muted-foreground">
                        Relative or absolute path where files will be stored
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Common Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={formData.maxFileSize / 1048576} // Convert bytes to MB
                    onChange={(e) => setFormData({ ...formData, maxFileSize: parseInt(e.target.value) * 1048576 })}
                    min="1"
                    max="100"
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum file size allowed for uploads (in megabytes)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Allowed File Types</Label>
                  <div className="space-y-2">
                    {['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={formData.allowedFileTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, allowedFileTypes: [...formData.allowedFileTypes, type] })
                            } else {
                              setFormData({ ...formData, allowedFileTypes: formData.allowedFileTypes.filter(t => t !== type) })
                            }
                          }}
                        />
                        <Label htmlFor={type} className="text-sm font-normal cursor-pointer">
                          {type === 'image/*' ? 'Images (JPG, PNG, etc.)' :
                           type === 'application/pdf' ? 'PDF Documents' :
                           type === 'application/msword' ? 'Word Documents (.doc)' :
                           type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'Word Documents (.docx)' :
                           type === 'application/vnd.ms-excel' ? 'Excel Spreadsheets (.xls)' :
                           'Excel Spreadsheets (.xlsx)'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Last Updated Info */}
              {settings?.updatedBy && (
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Last updated: {formatDate(settings.updatedAt)}
                  </span>
                  <span>
                    By: {settings.updatedBy.name} ({settings.updatedBy.email})
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveClick}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {activeTab === 'currency' ? 'Currency' : 'Storage'} Settings Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeTab === 'currency' 
                ? 'You are about to change the system currency settings:'
                : 'You are about to change the file storage settings:'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            {activeTab === 'currency' ? (
              <>
                <ul className="list-disc list-inside space-y-1">
                  <li>Main Currency: {currencySymbols[formData.mainCurrency]} ({formData.mainCurrency})</li>
                  {formData.additionalCurrency1 && formData.additionalCurrency1 !== 'none' && (
                    <li>
                      Additional Currency 1: {currencySymbols[formData.additionalCurrency1 as Currency]} ({formData.additionalCurrency1})
                      - Rate: {formData.exchangeRate1}
                    </li>
                  )}
                  {formData.additionalCurrency2 && formData.additionalCurrency2 !== 'none' && (
                    <li>
                      Additional Currency 2: {currencySymbols[formData.additionalCurrency2 as Currency]} ({formData.additionalCurrency2})
                      - Rate: {formData.exchangeRate2}
                    </li>
                  )}
                </ul>
                <p className="font-medium text-sm">
                  This will affect all currency displays and calculations throughout the system. 
                  Are you sure you want to continue?
                </p>
              </>
            ) : (
              <>
                <ul className="list-disc list-inside space-y-1">
                  <li>Storage Provider: {formData.storageProvider === StorageProvider.UPLOADTHING ? 'UploadThing (Cloud)' : 'Local File System'}</li>
                  {formData.storageProvider === StorageProvider.UPLOADTHING && (
                    <>
                      <li>App ID: {formData.uploadThingAppId || 'Not set'}</li>
                      <li>Token: {formData.uploadThingToken ? '••••••••' : 'Not set'}</li>
                    </>
                  )}
                  {formData.storageProvider === StorageProvider.LOCAL && (
                    <li>Storage Path: {formData.localStoragePath}</li>
                  )}
                  <li>Max File Size: {formData.maxFileSize / 1048576}MB</li>
                  <li>File Types: {formData.allowedFileTypes.length} types allowed</li>
                </ul>
                <p className="font-medium text-sm">
                  This will affect how files are stored and accessed in the system. 
                  Are you sure you want to continue?
                </p>
              </>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Confirm Changes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}