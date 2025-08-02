"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { LoginModal } from "@/components/auth/login-modal"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [userInfo, setUserInfo] = useState<{ email: string; role?: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[Landing] Auth check error:', error)
          setIsAuthenticated(false)
          setUserInfo(null)
        } else {
          setIsAuthenticated(!!session)
          if (session?.user) {
            setUserInfo({
              email: session.user.email || '',
              role: 'SUPERUSER' // For now, hardcoded since we know the test user
            })
          }
        }
      } catch (err) {
        console.error('[Landing] Unexpected error during auth check:', err)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
    
    // Listen for auth state changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
      if (session?.user) {
        setUserInfo({
          email: session.user.email || '',
          role: 'SUPERUSER'
        })
      } else {
        setUserInfo(null)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setUserInfo(null)
    router.refresh()
  }
  
  const handleLoginSuccess = () => {
    // Auth state will be updated automatically by the listener
    // Just ensure we're on the landing page
    setShowLoginModal(false)
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <svg className="w-32 h-32 mx-auto" viewBox="0 0 100 100">
              <path d="M50 5 L61.8 39.1 L97.6 39.1 L69.9 60.9 L81.6 95 L50 73.2 L18.4 95 L30.1 60.9 L2.4 39.1 L38.2 39.1 Z" 
                    className="fill-[#a6a6a6]" />
            </svg>
          </div>
          <p className="mt-6 text-xl text-[#737373]">
            finding love in strange repos + ahrvanovic
          </p>
          
          <div className="mt-12 space-y-4">
            {isAuthenticated && userInfo ? (
              <>
                <div className="text-center space-y-2 mb-6">
                  <p className="text-[#a6a6a6]">Logged in as</p>
                  <p className="text-[#cccccc] font-medium">{userInfo.email}</p>
                  <p className="text-[#737373] text-sm">{userInfo.role}</p>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleLogout}
                  className="bg-transparent border border-[#404040] text-[#a6a6a6] hover:bg-[#2a2a2a] hover:text-[#cccccc] hover:border-[#525252] transition-colors"
                >
                  Logout
                </Button>
                <div className="mt-4">
                  <Button 
                    size="lg" 
                    asChild
                    className="bg-transparent border border-[#404040] text-[#a6a6a6] hover:bg-[#2a2a2a] hover:text-[#cccccc] hover:border-[#525252] transition-colors"
                  >
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
              </>
            ) : (
              <Button 
                size="lg" 
                onClick={() => setShowLoginModal(true)}
                className="bg-transparent border border-[#404040] text-[#a6a6a6] hover:bg-[#2a2a2a] hover:text-[#cccccc] hover:border-[#525252] transition-colors"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <footer className="py-6 text-center text-sm text-[#737373]">
        © 2025
      </footer>
      
      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal}
        onSuccess={handleLoginSuccess}
      />
    </div>
  )
}