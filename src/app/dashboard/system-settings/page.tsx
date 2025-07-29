'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { Loader2, Save, AlertCircle, Settings, DollarSign, RefreshCw, X } from 'lucide-react'
import { Currency } from '@prisma/client'
import { formatDate } from '@/lib/utils'

interface SystemSettings {
  id: string
  mainCurrency: Currency
  additionalCurrency1: Currency | null
  additionalCurrency2: Currency | null
  exchangeRate1: number | null
  exchangeRate2: number | null
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
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations()
  
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  const [formData, setFormData] = useState({
    mainCurrency: Currency.EUR as Currency,
    additionalCurrency1: null as Currency | null,
    additionalCurrency2: null as Currency | null,
    exchangeRate1: '',
    exchangeRate2: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user || session.user.role !== 'SUPERUSER') {
      router.push('/dashboard')
      return
    }
    
    fetchSettings()
  }, [session, status, router])

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
        exchangeRate2: data.exchangeRate2?.toString() || ''
      })
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
      
      const payload = {
        mainCurrency: formData.mainCurrency,
        additionalCurrency1: formData.additionalCurrency1 === 'none' ? null : formData.additionalCurrency1,
        additionalCurrency2: formData.additionalCurrency2 === 'none' ? null : formData.additionalCurrency2,
        exchangeRate1: formData.additionalCurrency1 && formData.additionalCurrency1 !== 'none' && formData.exchangeRate1 
          ? parseFloat(formData.exchangeRate1) 
          : null,
        exchangeRate2: formData.additionalCurrency2 && formData.additionalCurrency2 !== 'none' && formData.exchangeRate2 
          ? parseFloat(formData.exchangeRate2) 
          : null
      }
      
      const response = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update settings')
      }
      
      const updatedSettings = await response.json()
      setSettings(updatedSettings)
      setShowConfirmDialog(false)
      toast.success('System settings updated successfully')
      
      // Reload the page to apply new settings
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      console.error('Failed to update system settings:', error)
      toast.error(error.message || 'Failed to update system settings')
    } finally {
      setSaving(false)
    }
  }

  const validateForm = () => {
    // Check if additional currency has exchange rate
    if (formData.additionalCurrency1 && formData.additionalCurrency1 !== 'none' && !formData.exchangeRate1) {
      toast.error('Exchange rate is required for additional currency 1')
      return false
    }
    
    if (formData.additionalCurrency2 && formData.additionalCurrency2 !== 'none' && !formData.exchangeRate2) {
      toast.error('Exchange rate is required for additional currency 2')
      return false
    }
    
    // Check if currencies are unique
    if (formData.additionalCurrency1 !== 'none' && formData.additionalCurrency1 === formData.mainCurrency) {
      toast.error('Additional currency 1 cannot be the same as main currency')
      return false
    }
    
    if (formData.additionalCurrency2 !== 'none' && formData.additionalCurrency2 === formData.mainCurrency) {
      toast.error('Additional currency 2 cannot be the same as main currency')
      return false
    }
    
    if (formData.additionalCurrency1 !== 'none' && formData.additionalCurrency2 !== 'none' && 
        formData.additionalCurrency1 === formData.additionalCurrency2) {
      toast.error('Additional currencies must be different')
      return false
    }
    
    return true
  }

  const handleSaveClick = () => {
    if (validateForm()) {
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

  if (session?.user?.role !== 'SUPERUSER') {
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
                    additionalCurrency1: value === 'none' ? null : value as Currency 
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
                    disabled={!formData.additionalCurrency1 || formData.additionalCurrency1 === 'none'}
                  />
                  {formData.additionalCurrency1 && formData.additionalCurrency1 !== 'none' && formData.exchangeRate1 && (
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
                    additionalCurrency2: value === 'none' ? null : value as Currency 
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
                    disabled={!formData.additionalCurrency2 || formData.additionalCurrency2 === 'none'}
                  />
                  {formData.additionalCurrency2 && formData.additionalCurrency2 !== 'none' && formData.exchangeRate2 && (
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

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Currency Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change the system currency settings:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <ul className="list-disc list-inside space-y-1">
              <li>Main Currency: {currencySymbols[formData.mainCurrency]} ({formData.mainCurrency})</li>
              {formData.additionalCurrency1 && formData.additionalCurrency1 !== 'none' && (
                <li>
                  Additional Currency 1: {currencySymbols[formData.additionalCurrency1]} ({formData.additionalCurrency1})
                  - Rate: {formData.exchangeRate1}
                </li>
              )}
              {formData.additionalCurrency2 && formData.additionalCurrency2 !== 'none' && (
                <li>
                  Additional Currency 2: {currencySymbols[formData.additionalCurrency2]} ({formData.additionalCurrency2})
                  - Rate: {formData.exchangeRate2}
                </li>
              )}
            </ul>
            <p className="font-medium text-sm">
              This will affect all currency displays and calculations throughout the system. 
              Are you sure you want to continue?
            </p>
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