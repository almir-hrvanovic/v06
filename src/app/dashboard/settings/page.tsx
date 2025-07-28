'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/theme-context'
import { 
  User, 
  Palette, 
  Languages, 
  Bell, 
  Shield, 
  Save,
  Mail,
  Phone,
  Building,
  Briefcase,
  Sun,
  Moon,
  Monitor,
  X,
} from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const t = useTranslations('settings')
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  
  // Form states
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
  })
  
  const [selectedLanguage, setSelectedLanguage] = useState('hr')
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    inquiryUpdates: true,
    quotesReady: true,
    approvalsNeeded: true,
    weeklyReports: false,
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // Load user data and preferences
  useEffect(() => {
    const loadUserData = async () => {
      if (!session?.user) return
      
      setIsLoading(true)
      try {
        // Load profile data
        setProfileData({
          name: session.user.name || '',
          email: session.user.email || '',
          phone: '', // Would come from API
          company: '', // Would come from API
          role: session.user.role || '',
        })
        
        // Load language preference
        const langResponse = await fetch(`/api/users/${session.user.id}/language`)
        if (langResponse.ok) {
          const data = await langResponse.json()
          setSelectedLanguage(data.language)
        }
        
        // Load notification preferences
        // This would be an API call in production
        // const notifResponse = await fetch(`/api/users/${session.user.id}/notifications`)
        
      } catch (error) {
        console.error('Error loading user data:', error)
        toast.error('Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [session?.user])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      // API call to save profile
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveLanguage = async () => {
    if (!session?.user?.id) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${session.user.id}/language`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: selectedLanguage }),
      })

      if (response.ok) {
        toast.success(t('language.saved'))
        setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error(t('language.saveFailed'))
      }
    } catch (error) {
      toast.error(t('language.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    try {
      // API call to save notifications
      toast.success('Notification preferences updated')
    } catch (error) {
      toast.error('Failed to update notifications')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-10 w-10"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close settings</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 gap-2 h-auto p-1">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">Language</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="pl-10"
                      disabled
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+1 234 567 8900"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      placeholder="Acme Corp"
                      value={profileData.company}
                      onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="role"
                    value={profileData.role}
                    className="pl-10"
                    disabled
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base">Theme</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Select your preferred color theme
                </p>
                <RadioGroup value={theme} onValueChange={(value: any) => setTheme(value)}>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                         onClick={() => setTheme('light')}>
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                        <Sun className="h-4 w-4" />
                        Light
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                         onClick={() => setTheme('dark')}>
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                        <Moon className="h-4 w-4" />
                        Dark
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                         onClick={() => setTheme('system')}>
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                        <Monitor className="h-4 w-4" />
                        System
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Display Options</Label>
                  <p className="text-sm text-muted-foreground">
                    Additional display preferences
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Reduce spacing between elements
                      </p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Animations</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable interface animations
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Tab */}
        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle>{t('language.title')}</CardTitle>
              <CardDescription>
                {t('language.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                       onClick={() => setSelectedLanguage('hr')}>
                    <RadioGroupItem value="hr" id="hr" />
                    <Label htmlFor="hr" className="flex items-center gap-2 cursor-pointer">
                      <span className="text-lg">🇭🇷</span>
                      {t('language.croatian')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                       onClick={() => setSelectedLanguage('bs')}>
                    <RadioGroupItem value="bs" id="bs" />
                    <Label htmlFor="bs" className="flex items-center gap-2 cursor-pointer">
                      <span className="text-lg">🇧🇦</span>
                      {t('language.bosnian')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                       onClick={() => setSelectedLanguage('en')}>
                    <RadioGroupItem value="en" id="en" />
                    <Label htmlFor="en" className="flex items-center gap-2 cursor-pointer">
                      <span className="text-lg">🇺🇸</span>
                      {t('language.english')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                       onClick={() => setSelectedLanguage('de')}>
                    <RadioGroupItem value="de" id="de" />
                    <Label htmlFor="de" className="flex items-center gap-2 cursor-pointer">
                      <span className="text-lg">🇩🇪</span>
                      {t('language.german')}
                    </Label>
                  </div>
                </div>
              </RadioGroup>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveLanguage} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? t('language.saving') : t('language.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how and when you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base">Notification Methods</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Select how you want to receive notifications
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.email}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, email: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive browser push notifications
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.push}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, push: checked })
                      }
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-base">Notification Types</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose what you want to be notified about
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Inquiry Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        New inquiries and status changes
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.inquiryUpdates}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, inquiryUpdates: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Quotes Ready</Label>
                      <p className="text-sm text-muted-foreground">
                        When quotes are ready for review
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.quotesReady}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, quotesReady: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Approvals Needed</Label>
                      <p className="text-sm text-muted-foreground">
                        Items requiring your approval
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.approvalsNeeded}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, approvalsNeeded: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Weekly summary of activities
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, weeklyReports: checked })
                      }
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base">Password</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Change your account password
                </p>
                <Button variant="outline">Change Password</Button>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-base">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Add an extra layer of security to your account
                </p>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable 2FA</Label>
                    <p className="text-sm text-muted-foreground">
                      Require authentication code on login
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-base">Sessions</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage your active sessions
                </p>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  Sign Out All Other Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}