# 🚀 Quick Start Guide - Continue Development

## 30-Second Setup
```bash
npm install && npm run dev
```
App runs at: http://localhost:3000

## Current Status ✅
- **Production**: Live on Vercel
- **Errors**: None
- **Tests**: Passing
- **Next Task**: Workflow Automation

## Login Credentials
```
admin@gs-cms.com / password123
manager@gs-cms.com / password123
sales@gs-cms.com / password123
```

## What to Work On Next

### Option 1: Workflow Automation (Recommended)
```bash
# 1. Create automation models
code prisma/schema.prisma
# Add: WorkflowRule, AutomationLog models

# 2. Generate types
npx prisma generate
npx prisma db push

# 3. Create service
mkdir -p src/services/workflow
code src/services/workflow/automation-engine.ts

# 4. Build UI
mkdir -p src/app/dashboard/automation
code src/app/dashboard/automation/page.tsx
```

### Option 2: Advanced Reporting
```bash
# 1. Create report builder UI
mkdir -p src/app/dashboard/reports/builder
code src/app/dashboard/reports/builder/page.tsx

# 2. Add report templates
code prisma/schema.prisma
# Add: ReportTemplate, ScheduledReport models
```

### Option 3: Dark Mode
```bash
# 1. Update Tailwind config
code tailwind.config.ts
# Add: darkMode: 'class'

# 2. Create theme provider
code src/components/providers/theme-provider.tsx

# 3. Add toggle component
code src/components/ui/theme-toggle.tsx
```

## Common Commands
```bash
# Database
npm run db:studio       # Visual DB editor
npm run db:push        # Apply schema changes
npm run db:seed        # Add test data

# Development
npm run dev            # Start dev server
npm run build          # Check build
npm run type-check     # Check types

# Docker (optional)
docker-compose -f docker-compose.dev.yml up -d  # DB only
docker-compose up -d                             # Full app
```

## File Structure Reference
```
/src/app/              → Pages (Next.js 15)
/src/components/       → React components  
/src/lib/             → Utilities & configs
/src/services/        → Business logic
/prisma/              → Database schema
/.github/workflows/   → CI/CD
```

## Need Help?
1. Check `SESSION_NOTES.md` for detailed info
2. Review `PROJECT_SUMMARY.md` for overview
3. See `CLAUDE.md` for coding standards

## Git Workflow
```bash
git checkout -b feature/workflow-automation
# Make changes
git add .
git commit -m "feat: add workflow automation"
git push origin feature/workflow-automation
# Create PR on GitHub
```

Ready to code! 🎯