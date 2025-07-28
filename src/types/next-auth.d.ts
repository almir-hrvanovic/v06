import { UserRole } from '@prisma/client'
import 'next-auth'
import 'next-auth/adapters'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
      preferredLanguage: string
    }
  }

  interface User {
    role: UserRole
    preferredLanguage: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    preferredLanguage: string
  }
}

declare module 'next-auth/adapters' {
  interface AdapterUser {
    role?: UserRole
    preferredLanguage?: string
  }
}