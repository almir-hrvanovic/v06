# GS-CMS v05 - Enterprise Customer Relationship & Quote Management System

A modern, full-stack CRM system built with Next.js 15, TypeScript, and PostgreSQL for managing customer inquiries, quotes, and production orders with advanced role-based workflows.

## 🚀 Project Status
- **Production URL**: Deployed on Vercel ✅
- **Build Status**: All errors resolved ✅
- **Infrastructure**: Docker & CI/CD ready ✅
- **Documentation**: Complete ✅

## 📋 Quick Session Continuation Guide
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with your database credentials

# 4. Start development
npm run dev
# Or with auto-login: npm run dev:logged

# 5. Check pending tasks
cat PROJECT_SUMMARY.md | grep -A 10 "Pending Features"
```

### 🔐 Development Tools
- **Dev Auto-Login**: Maintain persistent dev sessions - [Quick Guide](./development/dev-auto-login-quick-ref.md)
- **Prisma Studio**: Visual database editor - `npm run db:studio`
- **Dev with Studio**: Both services - `npm run dev:full`

## 🌟 Features

### Core Business Workflow
1. **Sales** creates customer inquiries with multiple items
2. **VPP (VP Production)** assigns inquiry items to VPs with workload balancing
3. **VPs** calculate production costs and assign technical tasks to Tech Officers
4. **Managers** approve production costs with oversight capabilities
5. **Sales** applies margins and generates quotes for customers
6. **System** converts approved quotes to production orders

### Technical Features
- **Modern Stack**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Authentication**: NextAuth.js v5 with role-based permissions (7 user roles)
- **UI Components**: shadcn/ui with Radix UI primitives
- **Currency System**: Multi-currency support with automatic conversion and SUPERUSER management
- **Real-time Updates**: WebSocket-based notifications
- **File Management**: Secure uploads with UploadThing
- **Reporting**: Excel and PDF export capabilities
- **Analytics**: Comprehensive business insights dashboard
- **Performance**: Redis caching and database indexing
- **Security**: Rate limiting, input sanitization, secure headers
- **Mobile Ready**: Fully responsive design

## 🏗️ Architecture

### User Roles & Permissions
- **SUPERUSER**: Full system access
- **ADMIN**: User management, system configuration
- **MANAGER**: Approvals, reporting, oversight
- **SALES**: Inquiry creation, pricing, quotes
- **VPP**: Item assignment to VPs with workload management
- **VP**: Cost calculations, technical assignments
- **TECH**: Technical analysis, documentation

### Database Schema
- **Users**: Role-based user management
- **Customers**: Customer information and contact details
- **Inquiries**: Customer requests with multiple items
- **InquiryItems**: Individual items within inquiries
- **CostCalculations**: Material, labor, and overhead cost breakdowns
- **Approvals**: Manager approval workflow for cost calculations
- **Quotes**: Generated quotes with margin calculations
- **ProductionOrders**: Converted quotes for production
- **Notifications**: Real-time system notifications
- **AuditLogs**: Complete audit trail of all system actions
- **SystemSettings**: System-wide configuration including currency settings

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **State Management**: React Query (TanStack Query)
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics and reporting

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+ database (or Docker)
- Redis (optional, for caching)
- Git

### Quick Setup (Automated)

#### For Linux/Mac:
```bash
# Run the automated setup script
./scripts/dev-setup.sh
```

#### For Windows:
```powershell
# Run the automated setup script
.\scripts\dev-setup.ps1
```

The setup script will:
- Check prerequisites
- Create `.env.local` with secure defaults
- Install dependencies
- Set up Docker containers (if available)
- Initialize the database
- Create necessary directories

### Manual Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd GS-cms-v05
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database Configuration
# Option 1: Local Docker PostgreSQL (recommended)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gs_cms_v05?schema=public"

# Option 2: Your own PostgreSQL instance
# DATABASE_URL="postgresql://username:password@localhost:5432/gs_cms_v05?schema=public"

# Authentication (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secure-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Redis Cache (optional - falls back to in-memory)
REDIS_URL="redis://localhost:6379"

# File Upload (get from https://uploadthing.com/dashboard)
UPLOADTHING_TOKEN=""
UPLOADTHING_SECRET=""

# Development Features
ENABLE_CRON=false        # Enable background jobs
DEBUG=true               # Enable debug logging
```

#### 4. Database Setup

##### Using Docker (Recommended):
```bash
# Start PostgreSQL and Redis containers
docker-compose -f docker-compose.dev.yml up -d

# Wait for containers to be ready
sleep 5

# Push database schema
npx prisma db push

# Seed with sample data
npm run db:seed
```

##### Using Existing PostgreSQL:
```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push

# Seed with sample data
npm run db:seed
```

#### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

### Environment Variables Reference

See `.env.example` for a complete list of available environment variables with detailed descriptions.

#### Required Variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secure secret for NextAuth.js
- `NEXTAUTH_URL` - Application URL for authentication

#### Optional Variables:
- `REDIS_URL` - Redis connection (falls back to in-memory)
- `EMAIL_*` - Email configuration (logs to console if not set)
- `UPLOADTHING_*` - File upload service credentials
- `ENABLE_CRON` - Enable background jobs in development
- `DEBUG` - Enable debug logging

### Production Environment (Vercel)

For production deployment on Vercel:

1. **Set Environment Variables** in Vercel Dashboard:
   - All required variables from `.env.example`
   - Use production database URL
   - Generate new `NEXTAUTH_SECRET`
   - Set `NEXTAUTH_URL` to your production domain

2. **Database**: Use a managed PostgreSQL service like:
   - Supabase
   - Neon
   - PlanetScale
   - AWS RDS

3. **Redis** (optional): Use a managed Redis service like:
   - Upstash
   - Redis Cloud
   - AWS ElastiCache

4. **File Storage**: Configure UploadThing credentials

## 👥 Demo Accounts

The seed script creates demo accounts for testing:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@gs-cms.com | password123 | Full system access |
| Manager | manager@gs-cms.com | password123 | Approvals and oversight |
| Sales | sales@gs-cms.com | password123 | Create inquiries and quotes |
| VPP | vpp@gs-cms.com | password123 | Assign items to VPs |
| VP1 | vp1@gs-cms.com | password123 | Calculate costs |
| VP2 | vp2@gs-cms.com | password123 | Calculate costs |
| Tech1 | tech1@gs-cms.com | password123 | Technical documentation |
| Tech2 | tech2@gs-cms.com | password123 | Technical documentation |

## 📋 Available Scripts

\`\`\`bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database (careful!)
\`\`\`

## 🎯 Usage Guide

### For SUPERUSER
1. **System Settings**: Configure system-wide currency settings and exchange rates
2. **User Management**: Full control over all user accounts and roles
3. **System Configuration**: Access to all administrative functions
4. **Audit Oversight**: Complete visibility into system operations

### For Sales Users
1. **Create Inquiries**: Add new customer inquiries with multiple items
2. **Manage Customers**: Add and update customer information
3. **Generate Quotes**: Convert approved cost calculations into customer quotes
4. **Track Progress**: Monitor inquiry status through the workflow

### For VPP Users
1. **Review Submissions**: See all submitted inquiries needing assignment
2. **Assign Items**: Assign inquiry items to VPs based on expertise and workload
3. **Monitor Workload**: Track VP capacity and assignment distribution
4. **Bulk Operations**: Assign multiple items efficiently

### For VP Users
1. **View Assignments**: See items assigned for cost calculation
2. **Calculate Costs**: Break down material, labor, and overhead costs
3. **Add Technical Notes**: Provide detailed cost justification
4. **Track Approval Status**: Monitor manager approval progress

### For Manager Users
1. **Review Calculations**: Approve or reject VP cost calculations
2. **Provide Feedback**: Add comments for rejected calculations
3. **Monitor Workflow**: Oversee the entire inquiry-to-quote process
4. **Generate Reports**: Access analytics and performance metrics

## 🔒 Security Features

- **Role-Based Access Control**: Granular permissions for all user roles
- **Input Validation**: Zod schemas for all API endpoints
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **Authentication**: Secure session management with NextAuth.js
- **Audit Logging**: Complete trail of all system actions
- **CORS Protection**: Proper cross-origin request handling

## 📊 Performance Optimizations

- **Database Indexing**: Optimized queries with proper indexes
- **Pagination**: Efficient data loading with pagination
- **React Query**: Intelligent caching and background updates
- **Code Splitting**: Lazy loading of components and routes
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Analysis**: Webpack bundle optimization

## 📚 Documentation

For comprehensive documentation, visit the [Documentation Hub](docs/README.md).

### Key Documentation
- [Deployment Guide](docs/deployment/DEPLOYMENT.md) - Production deployment
- [Automation Features](docs/features/AUTOMATION_FEATURE.md) - Workflow automation
- [User Management](docs/USER_MANAGEMENT.md) - User system documentation
- [Business Partners](docs/BUSINESS_PARTNERS.md) - Business partner management
- [Currency System](docs/currency-system.md) - System-wide currency configuration and conversion
- [Currency Quick Reference](docs/currency-quick-reference.md) - Quick guide for currency operations
- [Testing Guide](docs/testing/) - Testing documentation
- [i18n Guide](docs/i18n/) - Internationalization documentation

## 🚀 Deployment

See [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=your-repo-url)

1. Click the deploy button above
2. Configure environment variables
3. Deploy automatically

### Production Build
\`\`\`bash
# Build for production
npm run build

# Start production server
npm run start
\`\`\`

## 🔧 Configuration

### Database Configuration
Update the \`DATABASE_URL\` in \`.env.local\` with your PostgreSQL connection string.

### Authentication Configuration
- Generate a secure \`NEXTAUTH_SECRET\` for production
- Update \`NEXTAUTH_URL\` to match your production domain

### Email Configuration (Optional)
Add email service configuration for notifications:
\`\`\`env
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="username"
EMAIL_SERVER_PASSWORD="password"
EMAIL_FROM="noreply@example.com"
\`\`\`

## 📚 API Documentation

### Authentication Endpoints
- \`POST /api/auth/signin\` - User sign in
- \`POST /api/auth/signout\` - User sign out
- \`GET /api/auth/session\` - Get current session

### Business Logic Endpoints
- \`GET|POST /api/inquiries\` - List/create inquiries
- \`GET|PUT|DELETE /api/inquiries/[id]\` - Inquiry operations
- \`GET /api/items\` - List inquiry items
- \`POST /api/items/assign\` - Bulk assign items to VPs
- \`GET|POST /api/costs\` - Cost calculations
- \`GET|POST /api/approvals\` - Approval workflow
- \`GET|POST /api/quotes\` - Quote management
- \`GET|POST /api/users\` - User management

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
- Verify PostgreSQL is running
- Check DATABASE_URL format and credentials
- Ensure database exists

**Authentication Not Working**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies and try again

**Permissions Denied**
- Check user role assignments
- Verify role-based permissions in \`src/lib/auth.ts\`
- Ensure user account is active

**Build Errors**
- Run \`npm run type-check\` to find TypeScript errors
- Check for missing environment variables
- Verify all dependencies are installed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the API documentation

## 🗺️ Roadmap

### Completed Features ✅
- [x] Advanced reporting and analytics dashboard
- [x] Real-time notifications with WebSocket
- [x] File attachment support with UploadThing
- [x] Advanced search and filtering
- [x] Export functionality (PDF quotes/reports, Excel data)
- [x] Mobile responsive design
- [x] API security with rate limiting
- [x] Redis caching layer
- [x] Database performance optimization

### Upcoming Features
- [ ] Email notifications system
- [ ] Multi-tenant support
- [ ] Advanced workflow customization
- [ ] Machine learning cost predictions
- [ ] Progressive Web App (PWA)
- [ ] Automated testing suite
- [ ] Dark mode theme

---

**Built with ❤️ using Next.js, TypeScript, and PostgreSQL**