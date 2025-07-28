import { Adapter, AdapterSession, AdapterUser } from 'next-auth/adapters'
import { prisma } from './db'
import { cache, cacheKeys } from './redis'
import { User } from '@prisma/client'

const SESSION_TTL = 30 * 24 * 60 * 60 // 30 days in seconds

// Helper to convert Prisma User to AdapterUser
function toAdapterUser(user: User): AdapterUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: null, // We don't use email verification
    name: user.name,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
  }
}

export function RedisAdapter(): Adapter {
  return {
    async createUser(data) {
      const user = await prisma.user.create({ data })
      await cache.del(cacheKeys.userList())
      return toAdapterUser(user)
    },

    async getUser(id) {
      // Try cache first
      const cached = await cache.get<AdapterUser>(cacheKeys.user(id))
      if (cached) return cached

      const user = await prisma.user.findUnique({ where: { id } })
      if (user) {
        const adapterUser = toAdapterUser(user)
        await cache.set(cacheKeys.user(id), adapterUser, SESSION_TTL)
        return adapterUser
      }
      return null
    },

    async getUserByEmail(email) {
      // Try cache first
      const cached = await cache.get<AdapterUser>(cacheKeys.userByEmail(email))
      if (cached) return cached

      const user = await prisma.user.findUnique({ where: { email } })
      if (user) {
        const adapterUser = toAdapterUser(user)
        await cache.set(cacheKeys.userByEmail(email), adapterUser, SESSION_TTL)
        await cache.set(cacheKeys.user(user.id), adapterUser, SESSION_TTL)
        return adapterUser
      }
      return null
    },

    async getUserByAccount({ providerAccountId, provider }) {
      // For now, we don't use OAuth providers, so this returns null
      return null
    },

    async updateUser({ id, ...data }) {
      const user = await prisma.user.update({
        where: { id },
        data,
      })
      
      // Invalidate caches
      await cache.del([
        cacheKeys.user(id),
        cacheKeys.userByEmail(user.email),
        cacheKeys.userList()
      ])
      
      return toAdapterUser(user)
    },

    async deleteUser(userId) {
      const user = await prisma.user.delete({ where: { id: userId } })
      
      // Invalidate caches
      await cache.del([
        cacheKeys.user(userId),
        cacheKeys.userByEmail(user.email),
        cacheKeys.userList()
      ])
      
      return toAdapterUser(user)
    },

    async linkAccount(account) {
      // Not implemented as we don't use OAuth
      return null as any
    },

    async unlinkAccount({ providerAccountId, provider }) {
      // Not implemented as we don't use OAuth
    },

    async createSession(data) {
      const session = {
        ...data,
        id: data.sessionToken,
      }
      
      // Store session in Redis
      await cache.set(
        cacheKeys.session(data.sessionToken),
        session,
        SESSION_TTL
      )
      
      return session as AdapterSession
    },

    async getSessionAndUser(sessionToken) {
      // Get session from Redis
      const session = await cache.get<AdapterSession>(
        cacheKeys.session(sessionToken)
      )
      
      if (!session || !session.userId) return null
      
      // Get user (will use cache if available)
      const user = await this.getUser!(session.userId)
      
      if (!user) {
        // Invalid session, clean up
        await cache.del(cacheKeys.session(sessionToken))
        return null
      }
      
      return { session, user }
    },

    async updateSession(data) {
      const { sessionToken } = data
      
      // Get existing session
      const existing = await cache.get<AdapterSession>(
        cacheKeys.session(sessionToken)
      )
      
      if (!existing) return null
      
      // Update session
      const updated = { ...existing, ...data }
      await cache.set(
        cacheKeys.session(sessionToken),
        updated,
        SESSION_TTL
      )
      
      return updated
    },

    async deleteSession(sessionToken) {
      const session = await cache.get<AdapterSession>(
        cacheKeys.session(sessionToken)
      )
      
      if (session) {
        await cache.del(cacheKeys.session(sessionToken))
      }
      
      return session
    },

    async createVerificationToken(data) {
      // Not implemented as we don't use email verification
      return null as any
    },

    async useVerificationToken({ identifier, token }) {
      // Not implemented as we don't use email verification
      return null
    },
  }
}