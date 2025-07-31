'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db/index'
import bcrypt from 'bcryptjs'

// Input validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

export async function authenticate(
  prevState: string | null | undefined,
  formData: FormData,
): Promise<string | null | undefined> {
  try {
    // Fast input validation
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }
    
    const validatedData = loginSchema.parse(rawData)
    
    // First check if user exists in our database and validate password
    const user = await db.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        password: true,
        isActive: true,
      }
    })
    
    if (!user || !user.isActive) {
      return 'Invalid email or password.'
    }
    
    // Check password using bcrypt
    const isPasswordValid = user.password 
      ? await bcrypt.compare(validatedData.password, user.password)
      : false
    
    if (!isPasswordValid) {
      return 'Invalid email or password.'
    }
    
    // Now sign in with Supabase
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })
    
    if (error) {
      console.error('Supabase auth error:', error)
      return 'Authentication failed. Please try again.'
    }
    
    // Redirect to dashboard on success
    redirect('/dashboard')
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return error.errors[0].message
    }
    
    // Check if it's a Next.js redirect (this is expected on successful login)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      // This is a successful redirect, let it propagate
      throw error
    }
    
    // Don't expose internal errors to client
    console.error('Authentication error:', error)
    return 'An unexpected error occurred. Please try again.'
  }
}