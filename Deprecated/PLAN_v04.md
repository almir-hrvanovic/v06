# Claude Code Instructions: Building Enterprise CMS with Next.js

## Project Brief for Claude Code

You are tasked with building a modern Customer Relationship & Quote Management System (CMS) using Next.js, React, TypeScript, and PostgreSQL. This system manages the complete workflow from customer inquiries through production orders, with a sophisticated role-based assignment system.

## Core Business Logic

The system follows this workflow:
1. **Sales** creates inquiries with multiple items from customers
2. **VPP (VP Production)** assigns inquiry items to VPs
3. **VPs** calculate costs and assign technical tasks to Tech Officers
4. **Managers** approve production costs
5. **Sales** applies margins and generates quotes
6. **System** converts approved quotes to production orders

## Technical Requirements

### Stack
- Next.js 14+ with App Router
- TypeScript
- PostgreSQL with Prisma ORM
- NextAuth.js for authentication
- TailwindCSS + shadcn/ui
- React Query for data fetching
- Vercel for deployment

### User Roles & Permissions
1. **Superuser**: Full system access
2. **Admin**: User management, system configuration
3. **Manager**: Approvals, reporting, oversight
4. **Sales**: Inquiry creation, pricing, quotes
5. **VPP**: Item assignment to VPs
6. **VP**: Cost calculations, tech assignments
7. **Tech**: Technical analysis, documentation

## Step-by-Step Implementation

### Phase 1: Project Setup and Foundation

```bash
# Initialize project
npx create-next-app@latest cms-enterprise --typescript --tailwind --app --src-dir --import-alias "@/*"

# Install core dependencies
npm install @prisma/client prisma
npm install next-auth @auth/prisma-adapter
npm install @tanstack/react-query @tanstack/react-table
npm install zod react-hook-form @hookform/resolvers
npm install lucide-react
npm install bcryptjs
npm install date-fns
npm install class-variance-authority clsx tailwind-merge

# Install shadcn/ui CLI
npx shadcn-ui@latest init
```

Configure shadcn/ui when prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

### Phase 2: Database Schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  passwordHash  String
  phone         String?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Group relationships
  primaryGroupId String?
  primaryGroup   UserGroup? @relation("PrimaryGroup", fields: [primaryGroupId], references: [id])
  memberships    UserGroupMembership[]
  
  // Assignment relationships
  itemsAssignedByMeAsVpp  InquiryItem[] @relation("AssignedByVpp")
  itemsAssignedToMeAsVp   InquiryItem[] @relation("AssignedToVp")
  itemsAssignedByMeAsVp   InquiryItem[] @relation("AssignedByVp")
  itemsAssignedToMeAsTech InquiryItem[] @relation("AssignedToTech")
  
  // Activity tracking
  activities     ActivityLog[]
  calculations   Calculation[]
  uploadedFiles  ItemFile[]
  approvedItems  InquiryItem[] @relation("ApprovedBy")
  updatedItems   InquiryItem[] @relation("UpdatedBy")
  createdBy      User?     @relation("CreatedBy", fields: [createdById], references: [id])
  createdById    String?
  createdUsers   User[]    @relation("CreatedBy")
  quotes         Quote[]
  performedHistory ItemHistory[]
  
  @@index([email])
  @@index([isActive])
}

model UserGroup {
  id           String   @id @default(cuid())
  name         String   @unique
  displayName  String
  description  String?
  permissions  Json     @default("{}")
  displayOrder Int      @default(999)
  createdAt    DateTime @default(now())
  
  members      UserGroupMembership[]
  primaryUsers User[] @relation("PrimaryGroup")
  
  @@index([name])
}

model UserGroupMembership {
  id        String   @id @default(cuid())
  userId    String
  groupId   String
  joinedAt  DateTime @default(now())
  isActive  Boolean  @default(true)
  
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  group     UserGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  @@unique([userId, groupId])
  @@index([userId])
  @@index([groupId])
}

model Customer {
  id           String   @id @default(cuid())
  companyName  String
  contactName  String
  email        String
  phone        String?
  address      String?
  city         String?
  postalCode   String?
  country      String?
  taxId        String?
  notes        String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  inquiries    Inquiry[]
  
  @@index([companyName])
  @@index([email])
}

model Inquiry {
  id             String   @id @default(cuid())
  customerId     String
  inquiryNumber  String   @unique
  title          String
  description    String?
  status         String   @default("draft") // draft, active, quoted, closed, cancelled
  priority       String   @default("medium") // low, medium, high, urgent
  requirements   Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdById    String
  
  customer       Customer @relation(fields: [customerId], references: [id])
  createdBy      User     @relation(fields: [createdById], references: [id])
  items          InquiryItem[]
  quotes         Quote[]
  activities     ActivityLog[]
  
  @@index([customerId])
  @@index([status])
  @@index([createdAt])
}

model InquiryItem {
  id                String    @id @default(cuid())
  inquiryId         String
  itemNumber        Int
  itemName          String
  description       String?
  quantity          Decimal
  unitOfMeasure     String
  requestedDelivery DateTime?
  promisedDelivery  DateTime?
  specifications    Json?
  customFields      Json?     // For deadline and other flexible data
  
  // VPP -> VP Assignment
  assignedToVpId    String?
  assignedByVppId   String?
  vpAssignedAt      DateTime?
  assignmentNotes   String?
  
  // VP -> Tech Assignment
  assignedToTechId  String?
  assignedByVpId    String?
  techAssignedAt    DateTime?
  techAssignmentStatus String? @default("pending") // pending, in_progress, completed
  
  // Financial
  productionCosts   Json?
  costBreakdown     Json?
  marginPercentage  Decimal?
  sellingPrice      Decimal?
  approvalStatus    String   @default("draft") // draft, pending_approval, approved, rejected
  approvedById      String?
  approvedAt        DateTime?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  updatedById       String?
  
  // Relations
  inquiry           Inquiry  @relation(fields: [inquiryId], references: [id], onDelete: Cascade)
  assignedToVp      User?    @relation("AssignedToVp", fields: [assignedToVpId], references: [id])
  assignedByVpp     User?    @relation("AssignedByVpp", fields: [assignedByVppId], references: [id])
  assignedToTech    User?    @relation("AssignedToTech", fields: [assignedToTechId], references: [id])
  assignedByVp      User?    @relation("AssignedByVp", fields: [assignedByVpId], references: [id])
  approvedBy        User?    @relation("ApprovedBy", fields: [approvedById], references: [id])
  updatedBy         User?    @relation("UpdatedBy", fields: [updatedById], references: [id])
  
  calculations      Calculation[]
  files            ItemFile[]
  history          ItemHistory[]
  quoteItems       QuoteItem[]
  
  @@unique([inquiryId, itemNumber])
  @@index([assignedToVpId])
  @@index([assignedToTechId])
  @@index([approvalStatus])
}

model Calculation {
  id              String   @id @default(cuid())
  itemId          String
  userId          String
  productionCosts Json
  totalCost       Decimal
  unitCost        Decimal
  notes           String?
  version         Int      @default(1)
  createdAt       DateTime @default(now())
  
  item            InquiryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  user            User        @relation(fields: [userId], references: [id])
  
  @@index([itemId])
  @@index([createdAt])
}

model ItemFile {
  id           String   @id @default(cuid())
  itemId       String
  filename     String
  url          String
  size         Int
  mimeType     String
  category     String   // excel, document, image, other
  uploadedById String
  uploadedAt   DateTime @default(now())
  
  item         InquiryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  uploadedBy   User        @relation(fields: [uploadedById], references: [id])
  
  @@index([itemId])
}

model ItemHistory {
  id            String   @id @default(cuid())
  itemId        String
  action        String   // created, assigned_to_vp, assigned_to_tech, calculated, approved, etc
  performedById String
  details       Json?
  createdAt     DateTime @default(now())
  
  item          InquiryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  performedBy   User        @relation(fields: [performedById], references: [id])
  
  @@index([itemId])
  @@index([action])
  @@index([createdAt])
}

model Quote {
  id            String   @id @default(cuid())
  inquiryId     String
  quoteNumber   String   @unique
  validUntil    DateTime
  totalAmount   Decimal
  status        String   @default("draft") // draft, sent, accepted, rejected, expired
  terms         String?
  createdById   String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  inquiry       Inquiry  @relation(fields: [inquiryId], references: [id])
  createdBy     User     @relation(fields: [createdById], references: [id])
  items         QuoteItem[]
  
  @@index([inquiryId])
  @@index([status])
}

model QuoteItem {
  id            String  @id @default(cuid())
  quoteId       String
  itemId        String
  quantity      Decimal
  unitPrice     Decimal
  totalPrice    Decimal
  description   String?
  
  quote         Quote       @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  inquiryItem   InquiryItem @relation(fields: [itemId], references: [id])
  
  @@index([quoteId])
}

model ActivityLog {
  id          String   @id @default(cuid())
  userId      String
  entityType  String   // inquiry, item, quote, etc
  entityId    String
  action      String
  details     Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  user        User @relation(fields: [userId], references: [id])
  
  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
}
```

### Phase 3: Authentication Setup

Create `src/lib/auth.ts`:

```typescript
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)
          
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
              primaryGroup: true,
              memberships: {
                where: { isActive: true },
                include: { group: true }
              }
            }
          })
          
          if (!user || !user.isActive) {
            return null
          }
          
          const isValidPassword = await bcrypt.compare(password, user.passwordHash)
          if (!isValidPassword) {
            return null
          }
          
          // Log successful login
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              entityType: "auth",
              entityId: user.id,
              action: "login",
              details: { timestamp: new Date() }
            }
          })
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.primaryGroup?.name || "guest",
            groups: user.memberships.map(m => m.group.name),
            permissions: user.primaryGroup?.permissions || {}
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.groups = user.groups
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.groups = token.groups as string[]
        session.user.permissions = token.permissions as any
      }
      return session
    }
  }
}
```

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

### Phase 4: API Routes Structure

Create the following API structure:

```
src/app/api/
├── auth/[...nextauth]/route.ts
├── customers/
│   ├── route.ts (GET, POST)
│   └── [id]/route.ts (GET, PUT, DELETE)
├── inquiries/
│   ├── route.ts (GET, POST)
│   ├── [id]/
│   │   ├── route.ts (GET, PUT, DELETE)
│   │   └── items/route.ts (GET, POST)
├── inquiry-items/
│   ├── [id]/
│   │   ├── route.ts (GET, PUT, DELETE)
│   │   ├── costs/route.ts (GET, POST)
│   │   ├── files/route.ts (GET, POST)
│   │   └── assign/route.ts (POST)
├── assignments/
│   ├── unassigned/route.ts (GET)
│   ├── assignable-users/route.ts (GET)
│   ├── stats/route.ts (GET)
│   └── bulk-assign/route.ts (POST)
├── quotes/
│   ├── route.ts (GET, POST)
│   └── [id]/route.ts (GET, PUT, DELETE)
└── reports/
    └── workload/route.ts (GET)
```

Example API route - `src/app/api/assignments/unassigned/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["vpp", "admin", "superuser"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    
    const skip = (page - 1) * limit
    
    const where = {
      assignedToVpId: null,
      inquiry: {
        status: "active"
      },
      ...(search && {
        OR: [
          { itemName: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { inquiry: { customer: { companyName: { contains: search, mode: "insensitive" } } } }
        ]
      })
    }
    
    const [items, total] = await Promise.all([
      prisma.inquiryItem.findMany({
        where,
        include: {
          inquiry: {
            include: {
              customer: true
            }
          }
        },
        orderBy: [
          { inquiry: { priority: "desc" } },
          { requestedDelivery: "asc" },
          { createdAt: "desc" }
        ],
        skip,
        take: limit
      }),
      prisma.inquiryItem.count({ where })
    ])
    
    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching unassigned items:", error)
    return NextResponse.json(
      { error: "Failed to fetch unassigned items" },
      { status: 500 }
    )
  }
}
```

### Phase 5: Core Components

Create these essential components:

1. **Layout Component** (`src/app/(dashboard)/layout.tsx`):

```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={session.user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
```

2. **Assignment Flow Component** (`src/components/assignments/assignment-flow.tsx`):

```typescript
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, TrendingUp, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface AssignmentFlowProps {
  items: any[]
  assignmentType: "vpp_to_vp" | "vp_to_tech"
  onComplete?: () => void
}

export function AssignmentFlow({ items, assignmentType, onComplete }: AssignmentFlowProps) {
  const [selectedUser, setSelectedUser] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [userStats, setUserStats] = useState<Record<string, any>>({})
  const { toast } = useToast()
  
  // Fetch assignable users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch(`/api/assignments/assignable-users?type=${assignmentType}`)
        const data = await response.json()
        setUsers(data.users)
        setUserStats(data.stats)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load assignable users",
          variant: "destructive"
        })
      }
    }
    
    fetchUsers()
  }, [assignmentType])
  
  const handleAssign = async () => {
    if (!selectedUser) return
    
    setIsLoading(true)
    try {
      const response = await fetch("/api/assignments/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: items.map(item => item.id),
          userId: selectedUser,
          type: assignmentType
        })
      })
      
      if (!response.ok) throw new Error("Assignment failed")
      
      toast({
        title: "Success",
        description: `${items.length} items assigned successfully`
      })
      
      onComplete?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign items",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const getWorkloadColor = (count: number) => {
    if (count < 5) return "text-green-500"
    if (count < 10) return "text-yellow-500"
    return "text-red-500"
  }
  
  const getOptimalUser = () => {
    if (!users.length) return null
    return users.reduce((optimal, user) => {
      const currentStats = userStats[user.id] || { week: 0, month: 0, year: 0 }
      const optimalStats = userStats[optimal.id] || { week: 0, month: 0, year: 0 }
      return currentStats.week < optimalStats.week ? user : optimal
    })
  }
  
  const optimalUser = getOptimalUser()
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Assign {items.length} item{items.length > 1 ? 's' : ''} to{' '}
          {assignmentType === 'vpp_to_vp' ? 'VP' : 'Tech Officer'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Select a user to assign the selected items. Workload statistics help balance assignments.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {users.map((user, index) => {
            const stats = userStats[user.id] || { week: 0, month: 0, year: 0 }
            const isSelected = selectedUser === user.id
            const isOptimal = user.id === optimalUser?.id
            
            return (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-md",
                    isSelected && "ring-2 ring-primary",
                    isOptimal && !isSelected && "ring-1 ring-green-500"
                  )}
                  onClick={() => setSelectedUser(user.id)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                      <AvatarImage src={`/api/avatar/${user.id}`} />
                      <AvatarFallback>
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    {isOptimal && (
                      <Badge variant="outline" className="text-green-600">
                        Optimal
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <Calendar className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className={cn("text-sm font-medium", getWorkloadColor(stats.week))}>
                        {stats.week}
                      </p>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </div>
                    <div>
                      <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className={cn("text-sm font-medium", getWorkloadColor(stats.month))}>
                        {stats.month}
                      </p>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </div>
                    <div>
                      <User className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm font-medium">{stats.year}</p>
                      <p className="text-xs text-muted-foreground">This year</p>
                    </div>
                  </div>
                  
                  {isOptimal && (
                    <p className="mt-3 text-xs text-green-600 flex items-center gap-1">
                      <span className="animate-pulse">✨</span>
                      Recommended for balanced workload
                    </p>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onComplete}>
          Cancel
        </Button>
        <Button 
          onClick={handleAssign}
          disabled={!selectedUser || isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Assign Items
        </Button>
      </div>
    </div>
  )
}
```

3. **Cost Calculator** (`src/components/calculations/cost-calculator.tsx`):

```typescript
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface CostCalculatorProps {
  item: any
  onSave: (costs: any) => Promise<void>
}

export function CostCalculator({ item, onSave }: CostCalculatorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [costs, setCosts] = useState({
    material: 0,
    materialOverhead: 0,
    labor: {
      hours: 0,
      rate: 0,
      total: 0
    },
    internalProcessing: {
      machining: 0,
      assembly: 0,
      finishing: 0,
      qualityControl: 0
    },
    externalProcessing: 0,
    externalServices: 0,
    otherCosts: {
      packaging: 0,
      shipping: 0,
      handling: 0
    },
    notes: ""
  })
  
  const totalCost = useMemo(() => {
    const materialTotal = costs.material + costs.materialOverhead
    const laborTotal = costs.labor.total
    const internalTotal = Object.values(costs.internalProcessing).reduce((sum, val) => sum + val, 0)
    const externalTotal = costs.externalProcessing + costs.externalServices
    const otherTotal = Object.values(costs.otherCosts).reduce((sum, val) => sum + val, 0)
    
    return materialTotal + laborTotal + internalTotal + externalTotal + otherTotal
  }, [costs])
  
  const unitCost = useMemo(() => {
    return totalCost / Number(item.quantity)
  }, [totalCost, item.quantity])
  
  const updateLabor = (field: string, value: number) => {
    const newLabor = { ...costs.labor, [field]: value }
    if (field === "hours" || field === "rate") {
      newLabor.total = newLabor.hours * newLabor.rate
    }
    setCosts({ ...costs, labor: newLabor })
  }
  
  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave({
        ...costs,
        total: totalCost,
        unitCost: unitCost
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Cost Calculator</CardTitle>
        <p className="text-sm text-muted-foreground">
          Calculate costs for {item.itemName} ({item.quantity} {item.unitOfMeasure})
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Material Costs */}
        <div className="space-y-4">
          <h4 className="font-medium">Material Costs</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="material">Base Material Cost</Label>
              <Input
                id="material"
                type="number"
                value={costs.material}
                onChange={(e) => setCosts({...costs, material: +e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="materialOverhead">Material Overhead (%)</Label>
              <Input
                id="materialOverhead"
                type="number"
                value={costs.materialOverhead}
                onChange={(e) => setCosts({...costs, materialOverhead: +e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Labor Costs */}
        <div className="space-y-4">
          <h4 className="font-medium">Labor Costs</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                value={costs.labor.hours}
                onChange={(e) => updateLabor("hours", +e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="rate">Rate per Hour</Label>
              <Input
                id="rate"
                type="number"
                value={costs.labor.rate}
                onChange={(e) => updateLabor("rate", +e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="laborTotal">Total Labor</Label>
              <Input
                id="laborTotal"
                type="number"
                value={costs.labor.total}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Internal Processing */}
        <div className="space-y-4">
          <h4 className="font-medium">Internal Processing</h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(costs.internalProcessing).map(([key, value]) => (
              <div key={key}>
                <Label htmlFor={key}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </Label>
                <Input
                  id={key}
                  type="number"
                  value={value}
                  onChange={(e) => setCosts({
                    ...costs,
                    internalProcessing: {
                      ...costs.internalProcessing,
                      [key]: +e.target.value
                    }
                  })}
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* External Costs */}
        <div className="space-y-4">
          <h4 className="font-medium">External Costs</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="externalProcessing">External Processing</Label>
              <Input
                id="externalProcessing"
                type="number"
                value={costs.externalProcessing}
                onChange={(e) => setCosts({...costs, externalProcessing: +e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="externalServices">External Services</Label>
              <Input
                id="externalServices"
                type="number"
                value={costs.externalServices}
                onChange={(e) => setCosts({...costs, externalServices: +e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Other Costs */}
        <div className="space-y-4">
          <h4 className="font-medium">Other Costs</h4>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(costs.otherCosts).map(([key, value]) => (
              <div key={key}>
                <Label htmlFor={key}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Label>
                <Input
                  id={key}
                  type="number"
                  value={value}
                  onChange={(e) => setCosts({
                    ...costs,
                    otherCosts: {
                      ...costs.otherCosts,
                      [key]: +e.target.value
                    }
                  })}
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Notes */}
        <div>
          <Label htmlFor="notes">Calculation Notes</Label>
          <Textarea
            id="notes"
            value={costs.notes}
            onChange={(e) => setCosts({...costs, notes: e.target.value})}
            placeholder="Add any notes about this calculation..."
            rows={3}
          />
        </div>
        
        <Separator />
        
        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Material & Overhead:</span>
            <span className="font-medium">${(costs.material + costs.materialOverhead).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Labor:</span>
            <span className="font-medium">${costs.labor.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Internal Processing:</span>
            <span className="font-medium">
              ${Object.values(costs.internalProcessing).reduce((sum, val) => sum + val, 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>External Costs:</span>
            <span className="font-medium">
              ${(costs.externalProcessing + costs.externalServices).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Other Costs:</span>
            <span className="font-medium">
              ${Object.values(costs.otherCosts).reduce((sum, val) => sum + val, 0).toFixed(2)}
            </span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-medium">
            <span>Total Cost:</span>
            <span className="text-lg">${totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Unit Cost:</span>
            <span>${unitCost.toFixed(2)} per {item.unitOfMeasure}</span>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Calculation"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Phase 6: Page Implementation

Create these pages following Next.js App Router conventions:

```
src/app/
├── (auth)/
│   └── login/page.tsx
├── (dashboard)/
│   ├── page.tsx (redirect to /dashboard)
│   ├── dashboard/page.tsx
│   ├── customers/
│   │   ├── page.tsx (list)
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx (view/edit)
│   │       └── inquiries/page.tsx
│   ├── inquiries/
│   │   ├── page.tsx (list)
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx (view)
│   │       ├── edit/page.tsx
│   │       └── items/[itemId]/page.tsx
│   ├── assignments/
│   │   ├── page.tsx (VPP view)
│   │   └── assign/page.tsx
│   ├── vp-dashboard/
│   │   ├── page.tsx
│   │   └── items/[id]/page.tsx
│   ├── quotes/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   └── settings/
│       ├── page.tsx
│       ├── users/page.tsx
│       └── profile/page.tsx
```

Example page - `src/app/(dashboard)/assignments/page.tsx`:

```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AssignmentsTable } from "@/components/assignments/assignments-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function AssignmentsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || !["vpp", "admin", "superuser"].includes(session.user.role)) {
    redirect("/dashboard")
  }
  
  const unassignedItems = await prisma.inquiryItem.findMany({
    where: {
      assignedToVpId: null,
      inquiry: {
        status: "active"
      }
    },
    include: {
      inquiry: {
        include: {
          customer: true
        }
      }
    },
    orderBy: [
      { inquiry: { priority: "desc" } },
      { requestedDelivery: "asc" }
    ]
  })
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">
            Manage and assign inquiry items to VPs
          </p>
        </div>
        <Link href="/assignments/assign">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Assign Items
          </Button>
        </Link>
      </div>
      
      <AssignmentsTable items={unassignedItems} />
    </div>
  )
}
```

### Phase 7: Key Features to Implement

1. **VPP Assignment Interface**:
   - Display unassigned inquiry items in a table
   - Multi-select with checkboxes
   - "Assign Items" button opens modal with VP user cards
   - Show workload stats for each VP (week/month/year counts)
   - Highlight optimal VP based on lowest workload
   - Confirm assignment with optional notes

2. **VP Dashboard**:
   - Stats cards: Pending, In Progress, Completed, Overdue
   - Table of assigned items with filters
   - Each item row has actions: View Details, Add Costs, Assign to Tech
   - Item detail page with three main sections:
     - Documents (browse/upload)
     - Excel Files (upload calculation sheets)
     - Cost Entry (production cost form)

3. **Cost Approval Workflow**:
   - VPs enter production costs
   - System calculates total and unit costs
   - Manager gets notification for approval
   - Approval/rejection with comments
   - Email notifications at each step

4. **Quote Generation**:
   - Sales team adds margins to approved costs
   - Generate PDF quotes with company branding
   - Quote validity period
   - Terms and conditions
   - Send via email with tracking

### Phase 8: Database Seeding

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create user groups
  const groups = await Promise.all([
    prisma.userGroup.create({
      data: {
        name: 'superuser',
        displayName: 'Superuser',
        displayOrder: 1,
        permissions: { all: true }
      }
    }),
    prisma.userGroup.create({
      data: {
        name: 'admin',
        displayName: 'Administrator',
        displayOrder: 2,
        permissions: {
          users: ['create', 'read', 'update', 'delete'],
          system: ['configure', 'backup'],
          reports: ['view_all', 'export']
        }
      }
    }),
    prisma.userGroup.create({
      data: {
        name: 'manager',
        displayName: 'Manager',
        displayOrder: 3,
        permissions: {
          approvals: ['costs', 'quotes'],
          reports: ['view_all', 'export'],
          inquiries: ['read', 'update']
        }
      }
    }),
    prisma.userGroup.create({
      data: {
        name: 'sales',
        displayName: 'Sales',
        displayOrder: 4,
        permissions: {
          inquiries: ['create', 'read', 'update'],
          quotes: ['create', 'read', 'update', 'send'],
          customers: ['create', 'read', 'update'],
          pricing: ['apply_margins', 'view_costs']
        }
      }
    }),
    prisma.userGroup.create({
      data: {
        name: 'vpp',
        displayName: 'VP Production',
        displayOrder: 5,
        permissions: {
          assignments: ['assign_to_vp', 'reassign'],
          inquiries: ['read', 'update'],
          reports: ['view_production']
        }
      }
    }),
    prisma.userGroup.create({
      data: {
        name: 'vp',
        displayName: 'Vice President',
        displayOrder: 6,
        permissions: {
          assignments: ['assign_to_tech'],
          calculations: ['create', 'update'],
          inquiries: ['read', 'update']
        }
      }
    }),
    prisma.userGroup.create({
      data: {
        name: 'tech',
        displayName: 'Technician',
        displayOrder: 7,
        permissions: {
          inquiries: ['read_assigned', 'update_assigned'],
          documents: ['upload', 'view']
        }
      }
    })
  ])

  // Create test users
  const password = await bcrypt.hash('TestPassword123!', 10)
  
  const users = [
    { email: 'admin@test.com', name: 'System Admin', group: 'admin' },
    { email: 'manager@test.com', name: 'Test Manager', group: 'manager' },
    { email: 'sales@test.com', name: 'Sales Rep', group: 'sales' },
    { email: 'vpp@test.com', name: 'VP Production', group: 'vpp' },
    { email: 'vp@test.com', name: 'Vice President', group: 'vp' },
    { email: 'vp2@test.com', name: 'Vice President 2', group: 'vp' },
    { email: 'tech@test.com', name: 'Technician', group: 'tech' },
    { email: 'tech2@test.com', name: 'Technician 2', group: 'tech' }
  ]

  for (const userData of users) {
    const group = groups.find(g => g.name === userData.group)!
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        passwordHash: password,
        primaryGroupId: group.id,
        memberships: {
          create: {
            groupId: group.id
          }
        }
      }
    })
  }

  // Create sample customer
  const customer = await prisma.customer.create({
    data: {
      companyName: 'Acme Manufacturing',
      contactName: 'John Doe',
      email: 'john@acme.com',
      phone: '+1234567890',
      address: '123 Industrial Ave',
      city: 'Manufacturing City',
      postalCode: '12345',
      country: 'USA'
    }
  })

  // Create sample inquiry with items
  const salesUser = await prisma.user.findUnique({ where: { email: 'sales@test.com' } })
  
  const inquiry = await prisma.inquiry.create({
    data: {
      customerId: customer.id,
      inquiryNumber: 'INQ-2024-001',
      title: 'Steel Components Order',
      description: 'Various steel components for production line',
      status: 'active',
      priority: 'high',
      createdById: salesUser!.id,
      items: {
        create: [
          {
            itemNumber: 1,
            itemName: 'Steel Plate A36',
            description: '10mm thickness, hot rolled',
            quantity: 100,
            unitOfMeasure: 'piece',
            requestedDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            specifications: {
              material: 'A36 Steel',
              thickness: '10mm',
              finish: 'Hot rolled'
            }
          },
          {
            itemNumber: 2,
            itemName: 'Aluminum Profile',
            description: 'Custom extrusion profile',
            quantity: 500,
            unitOfMeasure: 'meter',
            requestedDelivery: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            specifications: {
              material: '6061-T6',
              profile: 'Custom',
              length: '6m'
            }
          },
          {
            itemNumber: 3,
            itemName: 'Stainless Steel Fasteners',
            description: 'M10x50 hex bolts',
            quantity: 2000,
            unitOfMeasure: 'piece',
            requestedDelivery: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            specifications: {
              material: 'SS316',
              standard: 'DIN933',
              size: 'M10x50'
            }
          }
        ]
      }
    }
  })

  console.log('Database seeded successfully')
  console.log('Test users created with password: TestPassword123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Add to `package.json`:

```json
{
  "scripts": {
    "db:push": "prisma db push",
    "db:seed": "prisma db seed"
  },
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

### Phase 9: Environment Setup

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/cms_dev"
DIRECT_URL="postgresql://postgres:password@localhost:5432/cms_dev"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# Upload (optional - for file uploads)
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"

# Email (optional - for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@yourcompany.com"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="CMS Enterprise"
```

### Phase 10: Deployment Instructions

1. **Setup Vercel Project**:
   ```bash
   npm install -g vercel
   vercel login
   vercel link
   ```

2. **Configure Database**:
   - Option 1: Use Vercel Postgres
     ```bash
     vercel env pull .env.local
     ```
   
   - Option 2: Use Supabase/Neon
     - Create project on provider
     - Copy connection string
     - Add to Vercel environment variables

3. **Setup Environment Variables in Vercel**:
   ```bash
   # Add all environment variables
   vercel env add DATABASE_URL
   vercel env add DIRECT_URL
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   ```

4. **Deploy**:
   ```bash
   # Initial setup
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   
   # Deploy to preview
   vercel
   
   # Deploy to production
   vercel --prod
   ```

5. **Setup GitHub Integration**:
   - Connect GitHub repo in Vercel dashboard
   - Enable automatic deployments
   - Configure preview deployments for PRs

## Implementation Checklist

### Week 1: Foundation
- [ ] Initialize Next.js project with TypeScript
- [ ] Setup Prisma and database schema
- [ ] Implement authentication with NextAuth
- [ ] Create base layouts and navigation
- [ ] Setup shadcn/ui components
- [ ] Create user seeding script

### Week 2: Core Features
- [ ] Build customer CRUD operations
- [ ] Implement inquiry creation and management
- [ ] Create assignment workflow (VPP → VP)
- [ ] Build VP dashboard with assigned items
- [ ] Implement cost calculation interface
- [ ] Add file upload functionality

### Week 3: Advanced Features
- [ ] Implement approval workflow for managers
- [ ] Build quote generation system
- [ ] Add margin application for sales
- [ ] Create reporting dashboards
- [ ] Implement email notifications
- [ ] Add activity logging

### Week 4: Polish & Deploy
- [ ] Add loading states and error handling
- [ ] Implement search and filtering
- [ ] Add data export functionality
- [ ] Performance optimization
- [ ] Security audit
- [ ] Deploy to Vercel

## Important Implementation Notes

1. **Authentication First**: Get login working before anything else
2. **Follow the Schema**: Database schema is your source of truth
3. **Check Permissions**: Every API route must verify user permissions
4. **Use Transactions**: For multi-table updates (assignments, approvals)
5. **Error Handling**: Show user-friendly messages, log technical details
6. **Loading States**: Users should see feedback for every action
7. **Mobile Responsive**: Test on various screen sizes
8. **Type Safety**: Leverage TypeScript throughout
9. **Performance**: Use React Server Components where possible
10. **Testing**: Write tests as you build each feature

## Success Criteria

The application is complete when:
- [ ] All user roles can log in with proper dashboards
- [ ] VPP can assign items to VPs with workload balancing
- [ ] VPs can calculate costs and assign to technicians
- [ ] Managers can approve/reject production costs
- [ ] Sales can apply margins and generate quotes
- [ ] All actions have audit trails
- [ ] Email notifications work for key events
- [ ] Application is deployed and accessible on Vercel
- [ ] Performance is optimized (< 3s page loads)
- [ ] Mobile responsive design works properly

## Troubleshooting Common Issues

1. **Prisma Connection Issues**:
   ```bash
   # Reset database
   npx prisma db push --force-reset
   npx prisma db seed
   ```

2. **Type Errors**:
   ```bash
   # Regenerate Prisma types
   npx prisma generate
   ```

3. **Build Errors**:
   ```bash
   # Clear cache
   rm -rf .next
   npm run build
   ```

4. **Authentication Issues**:
   - Check NEXTAUTH_SECRET is set
   - Verify NEXTAUTH_URL matches deployment URL
   - Ensure database connection works

Remember: Build incrementally, test frequently, and focus on core functionality before optimization.