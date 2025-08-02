# Claude Code Configuration - FLOW2_test Project

## 🎯 Core Development Principles

### Error-Driven Development
- Be direct and factual about what's working and what's broken
- Use comprehensive logging and testing
- Focus on solving actual problems, not theoretical ones

### Concurrent Execution (CRITICAL)
**GOLDEN RULE**: All related operations MUST be batched in a single message
- TodoWrite: Include 5-10+ todos in ONE call
- Task spawning: Launch ALL agents together
- File operations: Batch Read/Write/Edit operations
- Bash commands: Group all terminal operations

## 💋 KISS Protocol (Keep It Simple, Stupid)

### STOP & CLARIFY Pattern
**User says:** "I want X to happen"  
**Claude responds:** "Got it. I'll make X happen by doing Y. Sound right?"  
**User says:** "Yes" or "No, I meant Z"

### 🚩 RED FLAGS - Call These Out Immediately

**When User Sees Claude:**
- Adding multiple files for a simple change
- Writing paragraphs of explanation
- Using setTimeout for CSS transitions
- Creating new state variables unnecessarily
- Saying "Let me refactor this properly"

**User Should Say:**
- "Stop. Too complex."
- "You're overthinking"
- "Just change the one thing"
- "KISS"

**When Claude Sees User:**
- Asking for multiple unrelated changes at once
- Not being specific about timing/colors/behavior

**Claude Should Say:**
- "Let me tackle one thing first: [specific thing]. OK?"
- "What exactly should it look like?"

### THE SIMPLE FIRST RULE
Before any change, Claude states:
1. What user wants
2. The simplest way to do it
3. What files will be touched

Example:
```
User: "Make star change color on login"
Claude: "I'll change the star's className to use isAuthenticated state. Only touching page.tsx. OK?"
```

### INCREMENTAL CHANGES
- One feature at a time
- Test it
- Confirm it works
- Then move to next

### 🎯 MAGIC PHRASES

**User Can Use:**
- **"KISS"** - Claude will immediately simplify
- **"One thing only"** - Claude will focus on just that
- **"Show me first"** - Claude will explain before doing
- **"Too many files"** - Claude will reduce scope

**Claude Will Use:**
- **"Simple fix:"** [explanation]
- **"This touches only:"** [filename]
- **"Before I continue..."**
- **"Does this look too complex?"**

## 🛠️ Project Commands

### Build & Quality
```bash
npm run build          # Build the project
npm run test           # Run test suite
npm run lint           # Lint and format
npm run type-check     # TypeScript checking (correct script name)
```

### Development Workflow
```bash
npm run dev            # Start development server
npm run format         # Format code
npm run clean          # Clean build artifacts
```

## 📋 Task Management

### TodoWrite Usage
Always batch todos - minimum 5-10 items per call:
```javascript
TodoWrite { todos: [
  { id: "1", content: "Task 1", status: "in_progress", priority: "high" },
  { id: "2", content: "Task 2", status: "pending", priority: "medium" },
  { id: "3", content: "Task 3", status: "pending", priority: "low" },
  // ... more todos
]}
```

### Task States
- `pending`: Not started
- `in_progress`: Currently working (limit to ONE at a time)
- `completed`: Finished successfully

## 🤖 AI Agent Coordination

### Available Agent Types
- `coder`: Implementation specialist
- `reviewer`: Code quality assurance
- `tester`: Test creation and validation
- `researcher`: Information gathering
- `planner`: Strategic planning
- `system-architect`: High-level design
- `code-analyzer`: Code analysis and insights

### Agent Spawning Pattern
Always spawn multiple agents concurrently:
```javascript
// ✅ CORRECT - All agents in one message
Task("Coder agent: Implement feature X with full specs")
Task("Tester agent: Create comprehensive tests")
Task("Reviewer agent: Review code quality and patterns")
```

### Agent Initialization
- Always initialise code-analyzer agent when analyst is needed

## 🔄 Workflow Patterns

### File Operations
Batch all file operations together:
```javascript
// Read multiple files
Read("src/component1.tsx")
Read("src/component2.tsx")
Read("tests/test1.spec.ts")

// Write multiple files
Write("output1.js", content1)
Write("output2.js", content2)
```

### Command Execution
Group related bash commands:
```javascript
Bash("mkdir -p src/{components,utils,types}")
Bash("npm install")
Bash("npm run test")
Bash("npm run build")
```

## 📁 Project Structure

```
FLOW2_test/
├── src/                 # Source code
├── tests/              # Test files
├── docs/               # Documentation
├── scripts/            # Build and utility scripts
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript config
```

## 🎨 Code Style

### General Guidelines
- Keep files under 500 lines
- Use meaningful variable names
- Add comments only when necessary
- Follow existing patterns in the codebase
- Never hardcode secrets or sensitive data

### TypeScript Preferences
- Use strict mode
- Prefer interfaces over types for object shapes
- Use proper error handling
- Leverage type inference when possible

## 🧪 Testing Strategy

### Test Types
- Unit tests: Individual functions and components
- Integration tests: Feature workflows
- E2E tests: Complete user journeys

### Test Commands
```bash
npm run test           # Run all tests
npm run test:unit      # Unit tests only
npm run test:e2e       # End-to-end tests
npm run test:watch     # Watch mode
```

## 🔍 Quality Assurance

### Pre-commit Checklist
1. All tests passing
2. No linting errors
3. TypeScript compilation successful
4. Code review completed (if applicable)

### Quality Commands
```bash
npm run lint           # Check code style
npm run typecheck      # Verify types
npm run format         # Auto-format code
```

## 🔄 Git Workflow

### Commit Guidelines
- Use conventional commit messages
- Keep commits focused and atomic
- Test before committing
- Never commit secrets or sensitive data

### Branch Strategy
- `main`: Production-ready code
- Feature branches: New development
- Hotfix branches: Critical fixes

## 📝 Documentation

### When to Document
- Public APIs and interfaces
- Complex business logic
- Setup and deployment procedures
- Architecture decisions

### Documentation Types
- Code comments: For complex logic only
- README files: Project overview and setup
- API docs: For public interfaces
- Architecture docs: For system design

## 🎯 Performance Guidelines

### Development Performance
- Use concurrent operations for better speed
- Batch file operations when possible
- Leverage caching for repeated tasks
- Monitor build times and optimize

### Runtime Performance
- Minimize bundle size
- Optimize database queries
- Use appropriate data structures
- Profile and measure performance

## ⚙️ Next.js Configuration

### next.config.ts Structure
```typescript
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  // Output configuration
  output: 'standalone',
  
  // React configuration
  reactStrictMode: true,
  
  // Image optimization (use remotePatterns, NOT domains)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/images/**',
      },
    ],
  },
  
  // Experimental features (Next.js 15.4.4)
  experimental: {
    optimizePackageImports: ['package-name'],
    // Note: optimizeCss is now default behavior
  },
  
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false, // Always check types
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false, // Always lint
    dirs: ['src'], // Specify directories to lint
  },
}

const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)
```

### TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": ["node_modules"]
}
```

### ESLint Configuration (.eslintrc.json)
```json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "rules": {
    "react/no-unescaped-entities": "off",
    "@next/next/no-html-link-for-pages": "off"
  }
}
```

### 📚 Configuration Documentation
- **Full Guide**: [`/docs/nextjs-configuration-guide.md`](./docs/nextjs-configuration-guide.md)
- **Deprecation Fixes**: ~~Moved to Deprecated folder - all fixes have been implemented~~

## 🔒 Security Best Practices

- Never commit secrets to version control
- Use environment variables for configuration
- Validate all user inputs
- Keep dependencies updated
- Follow security linting rules

## 💡 Tips & Best Practices

### Development Efficiency
- Use TodoWrite for complex tasks
- Spawn multiple agents for parallel work
- Batch file operations for speed
- Keep the feedback loop tight

### Code Quality
- Write tests first when possible
- Use meaningful names
- Keep functions small and focused
- Handle errors gracefully

### Collaboration
- Write clear commit messages
- Document architectural decisions
- Review code before merging
- Share knowledge with the team

## 💰 Currency System

### Overview
The application uses a system-wide currency configuration managed by SUPERUSER role. See full documentation: [`/docs/currency-system.md`](./docs/currency-system.md)

### Quick Reference
- **Main Components**:
  - Currency Utilities: `/src/lib/currency.ts`
  - Context Provider: `/src/contexts/currency-context.tsx`
  - System Settings: `/src/app/dashboard/system-settings/page.tsx`
  - API Endpoints: `/src/app/api/system-settings/route.ts`

### Key Features
- System-wide currency settings (not user-specific)
- SUPERUSER-only management
- Main currency + 2 additional currencies
- Automatic currency conversion
- Exchange rate configuration
- Real-time conversion preview

### Usage Example
```typescript
// In components
import { useMainCurrency } from '@/contexts/currency-context'
import { formatCurrency, convertCurrency } from '@/lib/currency'

const mainCurrency = useMainCurrency()
const converted = await convertCurrency(100, Currency.BAM, mainCurrency)
const formatted = formatCurrency(100, Currency.EUR, 'hr-HR')
```

### Important Notes
- Always convert to main currency for calculations
- Currency conversion is async (returns Promise)
- Settings are cached for 5 minutes
- Only SUPERUSER can modify settings

**Documentation**:
- Full documentation: [`/docs/currency-system.md`](./docs/currency-system.md)
- Quick reference: [`/docs/currency-quick-reference.md`](./docs/currency-quick-reference.md)

## 🎨 Theme & Language Persistence System

### Overview
The application uses a bulletproof persistence system for user preferences that ensures settings are never lost during page refreshes, browser restarts, or server restarts. The system combines database storage, cookie synchronization, and client-side initialization scripts.

### Key Features
- **Theme Persistence**: Light/Dark/System theme with localStorage + script initialization
- **Language Persistence**: Multi-language support with database + cookie synchronization  
- **Hydration Safety**: Prevents client/server mismatches and UI flashing
- **API Integration**: RESTful endpoints for preference management

### Quick Usage
```typescript
// Theme
import { useTheme } from '@/contexts/theme-context'
const { theme, setTheme, actualTheme } = useTheme()

// Language  
import { useLocale } from 'next-intl'
import { QuickLanguageSwitcher } from '@/components/language/language-switcher'
const locale = useLocale()
```

### Storage Architecture
```
Database (source of truth) → Cookie (server access) → localStorage (client) → UI
```

### Supported Languages
- **Croatian** (hr-HR) - Hrvatski 🇭🇷
- **Bosnian** (bs-BA) - Bosanski 🇧🇦  
- **English** (en-US) - English 🇺🇸
- **German** (de-DE) - Deutsch 🇩🇪

### API Endpoints
- `PUT /api/user/language` - Update user language preference
- `GET /api/user/language` - Get current language preference

**Documentation**:
- Full documentation: [`/docs/persistence-system.md`](./docs/persistence-system.md)
- Quick reference: [`/docs/persistence-quick-reference.md`](./docs/persistence-quick-reference.md)

## 🚀 Performance Optimization Sprint

**CRITICAL**: The application currently has severe performance issues (27+ second load times). A comprehensive optimization plan is documented in [`SPRINT.md`](./SPRINT.md).

### Quick Performance Wins
- Add caching headers to API routes
- Batch multiple API calls
- Implement React Query for client-side caching
- Use direct Supabase queries for hot paths

### Next Sprint Focus
The next development session should focus on implementing the performance optimizations outlined in SPRINT.md, starting with:
1. Redis caching implementation
2. Authentication flow optimization
3. Database view creation
4. Client-side caching with React Query

**See [`SPRINT.md`](./SPRINT.md) for the complete 10x performance improvement plan.**

## 🚨 Development Warnings

- Never restart dev server. Ask me to do it, or to let you to do it!

## 🔒 Authentication & Database Configuration

### Dynamic Authentication Setup
- **CRITICAL**: Use dynamic auth setup - NO HARDCODED authentication logic!
- All auth configuration must use centralized `AUTH_URLS` config
- Authentication fully integrated with Supabase
- See full documentation: [`/Documentation/auth/dynamic-auth-setup.md`](./Documentation/auth/dynamic-auth-setup.md)

### Dynamic Database Setup
- **CRITICAL**: Use dynamic database abstraction layer - NO DIRECT PRISMA IMPORTS!
- All database operations must go through the centralized `db` interface
- Supports multiple database providers (Prisma, Supabase, etc.)
- See full documentation: [`/Documentation/database/dynamic-db-setup.md`](./Documentation/database/dynamic-db-setup.md)

### Key Implementation Details
- **Database Import**: Use `import { db } from '@/lib/db'` (NOT `@/lib/prisma`)
- **Auth Import for API Routes**: Use `import { getAuthenticatedUserFromRequest } from '@/utils/supabase/api-helpers'`
- **⚠️ AUTH MIGRATION**: ~~Completed - docs moved to Deprecated folder~~
- **User Hook**: Enhanced `useAuth` automatically fetches full DB user data
- **Environment**: Configured for v06-development Supabase instance

### Test Credentials
- **Email**: almir.hrvanovic@icloud.com
- **Password**: QG'"^Ukj:_9~%9F
- **Role**: SUPERUSER

### Authentication & Database Memories

- **CRITICAL !!! FIRST THING TO CHECK! IS PROPER CENTRALISED AUTH AND DB CONNECTIONS - NO HARDCODE CONNECTIONS!**

## 🚨 API Authentication Migration Status

**CRITICAL**: API routes are being migrated from `getAuthenticatedUser` to `getAuthenticatedUserFromRequest`.

### ✅ Already Fixed Routes (DO NOT "FIX" THESE AGAIN!)
- `/api/users/me` ✅
- `/api/system-settings` ✅ 
- `/api/notifications` ✅

### ⚠️ Migration Rules
1. **BEFORE CHANGING ANY API AUTH**: Check [`/API_AUTH_MIGRATION_STATUS.md`](./API_AUTH_MIGRATION_STATUS.md)
2. **USE**: `import { getAuthenticatedUserFromRequest } from '@/utils/supabase/api-helpers'`
3. **DO NOT USE**: `import { getAuthenticatedUser } from '@/utils/supabase/api-auth'`
4. **44+ routes still need migration** - See migration plan for details

### 📋 Migration Documents
- Current Status: [`/API_AUTH_MIGRATION_STATUS.md`](./API_AUTH_MIGRATION_STATUS.md)
- ~~Migration completed - plan moved to Deprecated folder~~
- Migration Script: [`/scripts/migrate-auth-category.sh`](./scripts/migrate-auth-category.sh)

## Critical Action Guidelines

### Code Modification Protocol
- **CRITICAL!!!  IF CODE WILL BREAK FUNCIONALITY ASK FOR SPECIAL PERMISIONS!**
- **CRITICAL!!!  DO NOT "FIX" ALREADY MIGRATED API ROUTES!**

## 🚨🚨🚨 CRITICAL CONFIGURATION PROTECTION 🚨🚨🚨

### ⛔ NEVER MODIFY THESE FILES (Configuration Locked)
1. **`.eslintrc.json`** - ESLint configuration is FINAL
2. **`tsconfig.json`** - TypeScript configuration is FINAL
3. **`.prettierrc`** - Prettier configuration is FINAL
4. **`.prettierignore`** - Prettier ignore is FINAL
5. **`.editorconfig`** - Editor configuration is FINAL
6. **`next.config.ts`** - Next.js configuration is FINAL (except env vars)

### ⛔ PROTECTED CONFIGURATION SECTIONS
- **ESLint Rules**: DO NOT add/remove/modify ANY ESLint rules
- **TypeScript Compiler Options**: DO NOT change ANY compiler options
- **Prettier Settings**: DO NOT change ANY formatting rules
- **Package.json Scripts**: DO NOT modify lint/format/type-check scripts

### ✅ Configuration Status (LOCKED)
- ESLint: Configured with Next.js best practices
- TypeScript: Strict mode with all checks enabled
- Prettier: Team formatting standards set
- Next.js 15.4.4: All deprecations fixed

### 📋 Reference Documents (READ-ONLY)
- [`/docs/nextjs-configuration-guide.md`](./docs/nextjs-configuration-guide.md)
- [`/docs/eslint-typescript-configuration.md`](./docs/eslint-typescript-configuration.md)
- ~~Next.js deprecation fixes completed - doc moved to Deprecated folder~~

**IF ANYONE ASKS TO MODIFY LINTING/FORMATTING/TYPESCRIPT CONFIG**: 
Direct them to read the configuration documents. Changes require team consensus and should not be made in individual sessions.

---

**Remember**: This configuration prioritizes practical development workflows, concurrent execution, and maintaining high code quality through systematic approaches.