# Project Structure - GS-CMS

## Root Directory
```
/
├── config/                 # All configuration files
│   ├── jest.*.js          # Jest configurations
│   ├── playwright.*.ts    # Playwright test configs
│   ├── postcss.config.mjs # PostCSS config
│   ├── tailwind.config.ts # Tailwind CSS config
│   ├── tsconfig.json      # TypeScript config
│   └── vercel.json        # Vercel deployment config
│
├── docs/                  # All documentation
│   ├── archive/          # Archived/old docs
│   ├── deployment/       # Deployment guides
│   ├── development/      # Development docs
│   ├── features/         # Feature documentation
│   ├── i18n/            # Internationalization docs
│   └── testing/         # Testing documentation
│
├── messages/             # Translation files
│   ├── bs.json          # Bosnian
│   ├── de.json          # German
│   ├── en.json          # English
│   └── hr.json          # Croatian
│
├── prisma/              # Database schema and migrations
│   ├── migrations/      # Database migrations
│   ├── schema.prisma    # Main schema
│   └── seed.ts         # Database seeding
│
├── public/              # Public assets
│   ├── locales/        # Optimized translations
│   └── favicon.svg     # App icon
│
├── scripts/            # All utility scripts
│   ├── deployment/     # Deployment scripts
│   ├── dev/           # Development scripts
│   ├── i18n/          # Translation management
│   └── maintenance/   # System maintenance scripts
│
├── src/               # Source code
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   ├── contexts/     # React contexts
│   ├── hooks/        # Custom React hooks
│   ├── i18n/         # i18n configuration
│   ├── lib/          # Utilities and services
│   ├── middleware/   # Next.js middleware
│   ├── styles/       # Global styles
│   └── types/        # TypeScript types
│
├── temp/             # Temporary files (gitignored)
│
├── tests/            # All test files
│   ├── e2e/         # End-to-end tests
│   └── unit/        # Unit tests
│
├── Docker files      # Container configuration
├── package.json     # Dependencies
└── next.config.ts   # Next.js configuration
```

## Key Improvements Made

1. **Centralized Configuration**: All config files moved to `/config`
2. **Organized Scripts**: Scripts categorized by purpose (dev, deployment, i18n, maintenance)
3. **Consolidated Tests**: All tests in `/tests` with e2e and unit subdirectories
4. **Clean Root**: Removed clutter from root directory
5. **Temporary Files**: Isolated in `/temp` directory

## Quick Access Paths

- Start dev server: `scripts/dev/start-local.sh`
- Run tests: Check files in `tests/`
- Deploy: `scripts/deployment/deploy-automation.sh`
- Manage translations: `scripts/i18n/`
- Database operations: `scripts/maintenance/`