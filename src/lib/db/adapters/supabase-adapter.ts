// Supabase database adapter
// Implements the DatabaseClient interface using Supabase client

import { createClient } from '@supabase/supabase-js'
import type { DatabaseClient, DatabaseOperations, User, SystemSettings, AuditLog, Notification } from '../types'
import { getCurrentDbConfig } from '@/lib/db-config'

// Note: This is a partial implementation showing the pattern
// In production, you'd need to map Supabase responses to match Prisma types

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    const config = getCurrentDbConfig()
    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey)
  }
  return supabaseClient
}

export function createSupabaseAdapter(): DatabaseClient {
  const supabase = getSupabaseClient()
  
  const operations: DatabaseOperations = {
    user: {
      findUnique: async ({ where }) => {
        let query = supabase.from('User').select('*')
        
        if (where.id) {
          query = query.eq('id', where.id)
        } else if (where.email) {
          query = query.eq('email', where.email)
        }
        
        const { data, error } = await query.single()
        if (error) return null
        return data as User
      },
      
      findMany: async (args = {}) => {
        let query = supabase.from('User').select('*')
        
        if (args.where) {
          Object.entries(args.where).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }
        
        if (args.take) query = query.limit(args.take)
        if (args.skip) query = query.range(args.skip, args.skip + (args.take || 10) - 1)
        
        const { data, error } = await query
        if (error) throw error
        return (data || []) as User[]
      },
      
      create: async ({ data }) => {
        const { data: result, error } = await supabase
          .from('User')
          .insert(data)
          .select()
          .single()
        
        if (error) throw error
        return result as User
      },
      
      update: async ({ where, data }) => {
        const { data: result, error } = await supabase
          .from('User')
          .update(data)
          .eq('id', where.id)
          .select()
          .single()
        
        if (error) throw error
        return result as User
      },
      
      delete: async ({ where }) => {
        const { data: result, error } = await supabase
          .from('User')
          .delete()
          .eq('id', where.id)
          .select()
          .single()
        
        if (error) throw error
        return result as User
      }
    },
    
    systemSettings: {
      findFirst: async () => {
        const { data, error } = await supabase
          .from('SystemSettings')
          .select('*')
          .limit(1)
          .single()
        
        if (error) return null
        return data as SystemSettings
      },
      
      create: async ({ data }) => {
        const { data: result, error } = await supabase
          .from('SystemSettings')
          .insert(data)
          .select()
          .single()
        
        if (error) throw error
        return result as SystemSettings
      },
      
      update: async ({ where, data }) => {
        const { data: result, error } = await supabase
          .from('SystemSettings')
          .update(data)
          .eq('id', where.id)
          .select()
          .single()
        
        if (error) throw error
        return result as SystemSettings
      }
    },
    
    auditLog: {
      create: async ({ data }) => {
        const { data: result, error } = await supabase
          .from('AuditLog')
          .insert({
            ...data,
            metadata: data.metadata || {}
          })
          .select()
          .single()
        
        if (error) throw error
        return result as AuditLog
      },
      
      findMany: async (args = {}) => {
        let query = supabase.from('AuditLog').select('*')
        
        if (args.where) {
          Object.entries(args.where).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }
        
        if (args.orderBy) {
          Object.entries(args.orderBy).forEach(([key, direction]) => {
            query = query.order(key, { ascending: direction === 'asc' })
          })
        }
        
        if (args.take) query = query.limit(args.take)
        if (args.skip) query = query.range(args.skip, args.skip + (args.take || 10) - 1)
        
        const { data, error } = await query
        if (error) throw error
        return (data || []) as AuditLog[]
      }
    },
    
    notification: {
      findMany: async (args = {}) => {
        let query = supabase.from('Notification').select('*')
        
        if (args.where) {
          Object.entries(args.where).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }
        
        if (args.orderBy) {
          Object.entries(args.orderBy).forEach(([key, direction]) => {
            query = query.order(key, { ascending: direction === 'asc' })
          })
        }
        
        if (args.take) query = query.limit(args.take)
        if (args.skip) query = query.range(args.skip, args.skip + (args.take || 10) - 1)
        
        const { data, error } = await query
        if (error) throw error
        return (data || []) as Notification[]
      },
      
      create: async ({ data }) => {
        const { data: result, error } = await supabase
          .from('Notification')
          .insert(data)
          .select()
          .single()
        
        if (error) throw error
        return result as Notification
      },
      
      update: async ({ where, data }) => {
        const { data: result, error } = await supabase
          .from('Notification')
          .update(data)
          .eq('id', where.id)
          .select()
          .single()
        
        if (error) throw error
        return result as Notification
      },
      
      updateMany: async ({ where, data }) => {
        let query = supabase.from('Notification').update(data)
        
        Object.entries(where).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
        
        const { error, count } = await query
        if (error) throw error
        return { count: count || 0 }
      }
    },
    
    $transaction: async (fn) => {
      // Note: Supabase doesn't have built-in transaction support like Prisma
      // This is a simplified implementation - in production you'd want to use
      // Supabase's RPC functions or handle this differently
      console.warn('Supabase adapter: Transaction support is limited')
      return fn(operations)
    }
  }
  
  return {
    ...operations,
    connect: async () => {
      // Supabase client auto-connects
    },
    disconnect: async () => {
      // Supabase client manages its own connections
    }
  }
}

// Export a singleton instance
export const supabaseAdapter = createSupabaseAdapter()