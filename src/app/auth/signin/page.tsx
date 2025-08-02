'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getUserFromDB } from '@/utils/supabase/auth-helpers'
import { AUTH_URLS } from '@/lib/auth-config'
import { Eye, EyeOff } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const t = useTranslations()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Sign in with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message || 'Invalid email or password.')
      } else if (data?.user) {
        // Successful login
        console.log('Login successful:', data.user.email)
        
        // Redirect to dashboard
        router.push(AUTH_URLS.dashboard)
        router.refresh()
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#1e1e1e]">
      <Card className="w-full max-w-md bg-[#2a2a2a] border-[#404040]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-100">{t('buttons.signIn')}</CardTitle>
          <CardDescription className="text-[#737373]">
            {t('dashboard.title')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#a6a6a6]">{t('common.labels.email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@domain.com"
                autoComplete="email"
                autoFocus
                required
                className="bg-[#1e1e1e] border-[#404040] text-[#cccccc] placeholder:text-[#737373] focus:border-[#525252] focus:ring-[#525252]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#a6a6a6]">Lozinka</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="pr-10 bg-[#1e1e1e] border-[#404040] text-[#cccccc] placeholder:text-[#737373] focus:border-[#525252] focus:ring-[#525252]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#737373] hover:text-[#a6a6a6]"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-400">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-transparent border border-[#404040] text-[#a6a6a6] hover:bg-[#2a2a2a] hover:text-[#cccccc] hover:border-[#525252] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.actions.loading') : t('buttons.signIn')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}