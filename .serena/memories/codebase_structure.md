# Codebase Structure

## Root Directory
- `src/` - Main source code
- `prisma/` - Database schema and migrations
- `public/` - Static assets
- `scripts/` - Utility scripts for database, i18n, etc.
- `__tests__/` - Test files
- `docs/` - Documentation
- `.github/` - CI/CD workflows

## Source Code Structure (`src/`)
- `app/` - Next.js 15 App Router pages and API routes
  - `api/` - API endpoints
  - `auth/` - Authentication pages
  - `dashboard/` - Main application pages
  - `layout.tsx` - Root layout
  - `page.tsx` - Home page
- `components/` - Reusable UI components
  - `ui/` - Base UI components (shadcn/ui)
  - `layout/` - Layout components
  - `providers/` - Context providers
- `lib/` - Utilities and configurations
  - `auth.ts` - Authentication configuration
  - `auth-redis-adapter.ts` - Redis session adapter
  - `automation/` - Workflow automation engine
- `types/` - TypeScript type definitions
- `hooks/` - Custom React hooks
- `services/` - Business logic services
- `i18n/` - Internationalization files
- `middleware.ts` - Next.js middleware

## Key Configuration Files
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - TailwindCSS configuration
- `tsconfig.json` - TypeScript configuration
- `prisma/schema.prisma` - Database schema
- `package.json` - Dependencies and scripts

## Important File Patterns
- API routes: `src/app/api/[endpoint]/route.ts`
- Pages: `src/app/[route]/page.tsx`
- Layouts: `src/app/[route]/layout.tsx`
- Components: `src/components/[feature]/[component].tsx`
- Types: `src/types/[entity].ts`