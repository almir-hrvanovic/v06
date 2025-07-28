'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { z } from 'zod'

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
    
    // Use the simpler signIn approach with redirectTo
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirectTo: '/dashboard',
    })
    
    // This line should not be reached if signIn is successful
    // as signIn will throw a redirect
    return null
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return error.errors[0].message
    }
    
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid email or password.'
        case 'AccessDenied':
          return 'Access denied. Please check your credentials.'
        default:
          return 'Authentication failed. Please try again.'
      }
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