'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LoginModal({ open, onOpenChange, onSuccess }: LoginModalProps) {
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
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message || 'Invalid email or password.')
      } else if (data?.user) {
        console.log('Login successful:', data.user.email)
        
        // Clear form
        setEmail('')
        setPassword('')
        
        // Close modal
        onOpenChange(false)
        
        // Call success callback
        onSuccess?.()
        
        // Refresh the page to update auth state
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2a2a2a] border-[#404040] text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-100">
            {t('buttons.signIn')}
          </DialogTitle>
          <DialogDescription className="text-[#737373]">
            Sign in to access your dashboard
          </DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4 text-[#737373]" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#a6a6a6]">
              {t('common.labels.email')}
            </Label>
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
            <Label htmlFor="password" className="text-[#a6a6a6]">
              Lozinka
            </Label>
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
      </DialogContent>
    </Dialog>
  )
}