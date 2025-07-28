# Essential Development Commands

## Development Workflow
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Database Operations
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with sample data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (careful!)
npm run db:reset
```

## Testing Commands
```bash
# Run all tests
npm run test

# Run CI pipeline tests
npm run test:ci

# Run i18n specific tests
npm run test:i18n
```

## i18n (Internationalization) Commands
```bash
# Validate translations
npm run i18n:validate

# Sync translation files
npm run i18n:sync

# Generate translations
npm run i18n:generate

# Optimize translations
npm run i18n:optimize
```

## Business Data Management
```bash
# Import business partners from CSV
npm run import:business-partners

# Verify business partners data
npm run verify:business-partners
```

## Essential System Commands (Linux)
- `ls` - list directory contents
- `cd` - change directory
- `grep` - search text patterns
- `find` - search files and directories
- `git` - version control operations
- `docker` - container management
- `docker-compose` - multi-container applications