"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { LoginModal } from "@/components/auth/login-modal"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [starRed, setStarRed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      setIsAuthenticated(!!session)
      setStarRed(!!session) // Keep star state in sync with auth
      setUserEmail(session?.user?.email || "")
    }
    
    checkAuth()
    
    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
      setUserEmail(session?.user?.email || "")
      
      // For logout, change star immediately
      if (event === 'SIGNED_OUT') {
        setStarRed(false)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    setStarRed(false) // Immediately update UI
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          {/* Star */}
          <div className="mb-6">
            <svg className="w-32 h-32 mx-auto" viewBox="0 0 100 100">
              <path 
                d="M50 5 L61.8 39.1 L97.6 39.1 L69.9 60.9 L81.6 95 L50 73.2 L18.4 95 L30.1 60.9 L2.4 39.1 L38.2 39.1 Z" 
                style={{
                  fill: starRed ? '#dc2626' : '#a6a6a6',
                  transition: 'fill 1s ease-in-out'
                }} 
              />
            </svg>
          </div>
          
          {/* Title */}
          <p className="mt-6 text-xl text-[#737373]">
            finding love in strange repos + ahrvanovic
          </p>
          
          {/* Buttons - fixed height container with smooth transitions */}
          <div className="mt-12 h-[50px] relative">
            <div className={`absolute inset-0 flex items-center justify-center gap-4 transition-all duration-500 ease-out ${
              isAuthenticated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2 pointer-events-none'
            }`}>
              <Button 
                size="lg" 
                onClick={handleLogout}
                className="bg-transparent border border-[#404040] text-[#a6a6a6] hover:bg-[#2a2a2a] hover:text-[#cccccc] hover:border-[#525252] transition-colors duration-300"
              >
                Logout
              </Button>
              <Button 
                size="lg" 
                asChild
                className="bg-transparent border border-[#404040] text-[#a6a6a6] hover:bg-[#2a2a2a] hover:text-[#cccccc] hover:border-[#525252] transition-colors duration-300"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
              !isAuthenticated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2 pointer-events-none'
            }`}>
              <Button 
                size="lg" 
                onClick={() => setShowLoginModal(true)}
                className="bg-transparent border border-[#404040] text-[#a6a6a6] hover:bg-[#2a2a2a] hover:text-[#cccccc] hover:border-[#525252] transition-colors duration-300"
              >
                Sign In
              </Button>
            </div>
          </div>
          
          {/* User info - always present container with fade transition */}
          <div className={`mt-8 h-[60px] transition-all duration-700 ease-out transform ${
            isAuthenticated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
            {isAuthenticated && (
              <div className="space-y-1">
                <p className="text-[#737373] text-sm">Logged in as</p>
                <p className="text-[#cccccc]">{userEmail}</p>
              </div>
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
        onSuccess={() => {
          // Start star animation quickly after modal closes
          setTimeout(() => {
            setStarRed(true)
          }, 200) // Short delay, then 1s transition
        }}
      />
    </div>
  )
}