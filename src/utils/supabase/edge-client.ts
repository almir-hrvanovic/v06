import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Edge Runtime compatible Supabase client
// This doesn't use cookies() or any Node.js APIs

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createEdgeClient(authHeader?: string) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const options: any = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }

  // If we have an auth header, use it
  if (authHeader) {
    options.global = {
      headers: {
        Authorization: authHeader
      }
    }
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, options)
}