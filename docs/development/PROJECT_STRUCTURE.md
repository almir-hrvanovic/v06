# Project Structure - GS-CMS Enterprise

## Directory Structure

```
gs-cms-v05/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth layout group
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/       # Dashboard layout group
│   │   │   ├── layout.tsx     # Dashboard wrapper
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   ├── inquiries/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   ├── assignments/
│   │   │   │   ├── page.tsx
│   │   │   │   └── assign/
│   │   │   ├── vp-dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── items/[id]/
│   │   │   ├── quotes/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   └── settings/
│   │   │       ├── page.tsx
│   │   │       ├── users/
│   │   │       └── profile/
│   │   ├── api/               # API Routes
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── customers/
│   │   │   ├── inquiries/
│   │   │   ├── inquiry-items/
│   │   │   ├── assignments/
│   │   │   ├── calculations/
│   │   │   ├── quotes/
│   │   │   ├── files/
│   │   │   └── reports/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── layout/           # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── navigation.tsx
│   │   │   └── footer.tsx
│   │   ├── customers/        # Customer components
│   │   │   ├── customer-form.tsx
│   │   │   ├── customer-table.tsx
│   │   │   └── customer-detail.tsx
│   │   ├── inquiries/        # Inquiry components
│   │   │   ├── inquiry-form.tsx
│   │   │   ├── inquiry-table.tsx
│   │   │   ├── inquiry-item-form.tsx
│   │   │   └── inquiry-status.tsx
│   │   ├── assignments/      # Assignment components
│   │   │   ├── assignment-flow.tsx
│   │   │   ├── assignments-table.tsx
│   │   │   ├── workload-stats.tsx
│   │   │   └── user-selector.tsx
│   │   ├── calculations/     # Calculation components
│   │   │   ├── cost-calculator.tsx
│   │   │   ├── cost-summary.tsx
│   │   │   └── calculation-history.tsx
│   │   ├── quotes/          # Quote components
│   │   │   ├── quote-builder.tsx
│   │   │   ├── quote-items.tsx
│   │   │   ├── margin-calculator.tsx
│   │   │   └── quote-pdf.tsx
│   │   ├── shared/          # Shared components
│   │   │   ├── data-table.tsx
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   └── permission-guard.tsx
│   │   └── providers/       # Context providers
│   │       ├── auth-provider.tsx
│   │       ├── theme-provider.tsx
│   │       └── query-provider.tsx
│   ├── lib/                 # Library code
│   │   ├── auth.ts         # NextAuth config
│   │   ├── prisma.ts       # Prisma client
│   │   ├── utils.ts        # Utility functions
│   │   ├── constants.ts    # App constants
│   │   ├── permissions.ts  # Permission helpers
│   │   ├── validations/    # Zod schemas
│   │   │   ├── customer.ts
│   │   │   ├── inquiry.ts
│   │   │   ├── calculation.ts
│   │   │   └── quote.ts
│   │   └── email/          # Email templates
│   │       ├── templates/
│   │       └── sender.ts
│   ├── hooks/              # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-permissions.ts
│   │   ├── use-inquiries.ts
│   │   ├── use-assignments.ts
│   │   └── use-debounce.ts
│   ├── services/           # API service layer
│   │   ├── api-client.ts
│   │   ├── customers.ts
│   │   ├── inquiries.ts
│   │   ├── assignments.ts
│   │   ├── calculations.ts
│   │   └── quotes.ts
│   ├── types/              # TypeScript types
│   │   ├── next-auth.d.ts
│   │   ├── api.ts
│   │   ├── database.ts
│   │   └── ui.ts
│   └── middleware.ts       # Next.js middleware
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts            # Seed script
│   └── migrations/        # Database migrations
├── public/                # Static files
│   ├── images/
│   └── fonts/
├── tests/                 # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                  # Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── USER_GUIDE.md
├── .env.local            # Local environment
├── .env.example          # Environment template
├── .eslintrc.json        # ESLint config
├── .prettierrc           # Prettier config
├── next.config.js        # Next.js config
├── tailwind.config.ts    # Tailwind config
├── tsconfig.json         # TypeScript config
├── package.json          # Dependencies
├── CLAUDE.md            # Claude instructions
├── CONTEXT7.md          # Context7 config
├── SPRINTS.md           # Sprint planning
├── PROJECT_STRUCTURE.md # This file
└── README.md            # Project overview
```

## Module Organization

### 1. App Directory (Next.js App Router)
- **Route Groups**: `(auth)` and `(dashboard)` for layout isolation
- **Dynamic Routes**: `[id]` for entity detail pages
- **API Routes**: RESTful endpoints under `/api`
- **Layouts**: Nested layouts for consistent UI

### 2. Components Directory
- **Feature-based**: Components grouped by feature
- **UI Library**: shadcn/ui components in `ui/`
- **Shared Components**: Reusable components in `shared/`
- **Providers**: Context providers for global state

### 3. Library Directory
- **Core Utilities**: Authentication, database, helpers
- **Validations**: Zod schemas for data validation
- **Email**: Email template management
- **Constants**: Application-wide constants

### 4. Services Directory
- **API Abstraction**: Clean interface for API calls
- **Error Handling**: Centralized error management
- **Type Safety**: Full TypeScript support

### 5. Types Directory
- **Type Definitions**: Shared TypeScript types
- **Module Augmentation**: NextAuth type extensions
- **API Types**: Request/response interfaces

## File Naming Conventions

### Components
- **PascalCase**: `CustomerForm.tsx`, `AssignmentFlow.tsx`
- **Index Files**: Use for main component exports
- **Test Files**: `ComponentName.test.tsx`

### Pages
- **lowercase**: `page.tsx`, `layout.tsx`
- **Dynamic**: `[id]/page.tsx`, `[...slug]/page.tsx`

### API Routes
- **lowercase**: `route.ts`
- **REST Verbs**: Export named functions (GET, POST, etc.)

### Utilities
- **camelCase**: `formatDate.ts`, `calculateCost.ts`
- **Kebab-case**: For multi-word files `api-client.ts`

## Import Organization

### Import Order
```typescript
// 1. React/Next.js imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Third-party libraries
import { z } from 'zod'
import { format } from 'date-fns'

// 3. Internal imports - absolute paths
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

// 4. Internal imports - relative paths
import { CustomerForm } from './customer-form'

// 5. Types
import type { Customer } from '@/types/database'
```

### Path Aliases
```json
{
  "@/*": ["./src/*"],
  "@/components/*": ["./src/components/*"],
  "@/lib/*": ["./src/lib/*"],
  "@/hooks/*": ["./src/hooks/*"]
}
```

## Component Structure

### Page Component Template
```typescript
// src/app/(dashboard)/customers/page.tsx
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CustomerTable } from '@/components/customers/customer-table'

export const metadata: Metadata = {
  title: 'Customers | GS-CMS',
  description: 'Manage customer information'
}

export default async function CustomersPage() {
  const session = await getServerSession(authOptions)
  
  // Server-side data fetching
  const customers = await fetchCustomers()
  
  return (
    <div className="space-y-6">
      <PageHeader />
      <CustomerTable data={customers} />
    </div>
  )
}
```

### Component Template
```typescript
// src/components/customers/customer-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { customerSchema } from '@/lib/validations/customer'
import type { CustomerFormData } from '@/types/forms'

interface CustomerFormProps {
  customer?: CustomerFormData
  onSubmit: (data: CustomerFormData) => Promise<void>
}

export function CustomerForm({ customer, onSubmit }: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || defaultValues
  })
  
  // Component logic
  
  return (
    <Form {...form}>
      {/* Form fields */}
    </Form>
  )
}
```

### API Route Template
```typescript
// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { customerSchema } from '@/lib/validations/customer'
import { hasPermission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Permission check
    if (!hasPermission(session.user, 'customers:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Business logic
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Customer fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Similar structure for POST
}
```

## State Management

### Server State
- **React Query**: For caching and synchronization
- **Server Components**: For initial data loading
- **Revalidation**: Using Next.js revalidation

### Client State
- **useState**: For local UI state
- **useReducer**: For complex state logic
- **Context**: For cross-component state

### Form State
- **react-hook-form**: For form management
- **Zod**: For validation
- **Controlled Components**: When necessary

## Testing Structure

### Unit Tests
```
tests/unit/
├── components/
├── hooks/
├── lib/
└── services/
```

### Integration Tests
```
tests/integration/
├── api/
├── auth/
└── workflows/
```

### E2E Tests
```
tests/e2e/
├── auth.spec.ts
├── customer-management.spec.ts
├── inquiry-workflow.spec.ts
└── quote-generation.spec.ts
```

## Performance Guidelines

### Code Splitting
- Dynamic imports for heavy components
- Route-based splitting (automatic)
- Lazy load modals and complex UI

### Data Fetching
- Server Components for initial load
- Parallel data fetching
- Implement pagination
- Use proper caching strategies

### Bundle Optimization
- Tree shaking imports
- Minimize client components
- Optimize images with next/image
- Use font subsetting

## Security Checklist

- [ ] All API routes check authentication
- [ ] Permission checks on sensitive operations
- [ ] Input validation with Zod
- [ ] SQL injection prevention (Prisma)
- [ ] XSS protection (React default)
- [ ] CSRF tokens (NextAuth)
- [ ] Environment variables secured
- [ ] No sensitive data in client code

## Development Workflow

### Branch Strategy
```
main
├── develop
│   ├── feature/customer-management
│   ├── feature/assignment-workflow
│   └── feature/quote-generation
├── hotfix/critical-bug
└── release/v1.0.0
```

### Commit Convention
```
feat: Add customer search functionality
fix: Resolve assignment calculation error
docs: Update API documentation
style: Format code with prettier
refactor: Optimize inquiry query
test: Add unit tests for quotes
chore: Update dependencies
```

### Code Review Checklist
- [ ] Follows project structure
- [ ] Includes appropriate tests
- [ ] Updates documentation
- [ ] Handles errors properly
- [ ] Maintains type safety
- [ ] Follows naming conventions
- [ ] Optimizes performance
- [ ] Ensures accessibility

This structure provides a scalable foundation for the GS-CMS enterprise application, ensuring maintainability and developer productivity.
