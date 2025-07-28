'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const t = useTranslations('settings')
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState('hr')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load current language preference
  useEffect(() => {
    const loadLanguagePreference = async () => {
      if (!session?.user?.id) return
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/users/${session.user.id}/language`)
        if (response.ok) {
          const data = await response.json()
          setSelectedLanguage(data.language)
        }
      } catch (error) {
        console.error('Error loading language preference:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLanguagePreference()
  }, [session?.user?.id])

  const handleSave = async () => {
    if (!session?.user?.id) {
      console.error('❌ No session or user ID available')
      toast.error('Authentication error')
      return
    }

    console.log('🚀 Starting language save for user:', session.user.id)
    console.log('🎯 Selected language:', selectedLanguage)

    setIsSaving(true)
    try {
      const url = `/api/users/${session.user.id}/language`
      const payload = { language: selectedLanguage }
      
      console.log('📤 Making request to:', url)
      console.log('📦 Request payload:', payload)
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.log('📡 API Response status:', response.status)
      console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('✅ API Success response:', responseData)
        toast.success(t('language.saved'))
        
        // Let the API handle cookie setting, just reload after delay
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        console.error('❌ API Response failed with status:', response.status)
        
        // Try to get error data, fallback if JSON parsing fails
        let errorData
        try {
          errorData = await response.json()
        } catch (jsonError) {
          console.error('Failed to parse error JSON:', jsonError)
          errorData = { error: `HTTP ${response.status} - ${response.statusText}` }
        }
        
        console.error('❌ Language save failed:', errorData)
        toast.error(`Error: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving language preference:', error)
      toast.error(t('language.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
            className="rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('language.title')}</CardTitle>
            <CardDescription>
              {t('language.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <RadioGroup
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hr" id="hr" />
                  <Label htmlFor="hr">{t('language.croatian')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bs" id="bs" />
                  <Label htmlFor="bs">{t('language.bosnian')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="en" />
                  <Label htmlFor="en">{t('language.english')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="de" id="de" />
                  <Label htmlFor="de">{t('language.german')}</Label>
                </div>
              </RadioGroup>
              
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? t('language.saving') : t('language.save')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}