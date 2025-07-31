import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/lib/db/index'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }
  
  // Get full user details from database
  const dbUser = await db.user.findUnique({
    where: { email: user.email! },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      preferredLanguage: true
    }
  })
  
  if (!dbUser) {
    redirect('/auth/signin')
  }
  
  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      preferredLanguage: dbUser.preferredLanguage
    }
  }
}

export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    // Get full user details from database
    const dbUser = await db.user.findUnique({
      where: { email: user.email! },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        preferredLanguage: true
      }
    })
    
    if (!dbUser) {
      return null
    }
    
    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        preferredLanguage: dbUser.preferredLanguage
      }
    }
  } catch (error) {
    console.error('Error getting server auth:', error)
    return null
  }
}