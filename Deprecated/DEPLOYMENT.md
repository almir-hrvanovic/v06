# GS-CMS v05 Deployment Guide

## 🚀 Quick Start - Vercel Deployment

### Prerequisites
- Vercel account
- GitHub repository with the code
- PostgreSQL database (Supabase, Neon, or Railway recommended)
- Redis instance (Upstash recommended for Vercel)

### Step 1: Database Setup

1. **Create PostgreSQL Database**
   - Recommended: [Supabase](https://supabase.com) (free tier available)
   - Alternative: [Neon](https://neon.tech) or [Railway](https://railway.app)

2. **Run Database Migrations**
   ```bash
   # Set DATABASE_URL in .env.local
   npx prisma generate
   npx prisma db push
   
   # Seed initial data (optional)
   npx prisma db seed
   ```

### Step 2: Redis Setup (Optional but Recommended)

1. **Create Redis Instance**
   - Recommended: [Upstash](https://upstash.com) (Vercel integration available)
   - Get your Redis URL from the dashboard

### Step 3: Environment Variables

Create these environment variables in Vercel:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Application
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# Redis (optional)
REDIS_URL="redis://..."

# UploadThing (for file uploads)
UPLOADTHING_TOKEN="your-token"
UPLOADTHING_SECRET="your-secret"
```

### Step 4: Deploy to Vercel

1. **Connect GitHub Repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables
   - Click "Deploy"

3. **Post-Deployment**
   - Run database migrations if needed
   - Test all functionality
   - Set up custom domain (optional)

## 🔧 Manual Deployment

### System Requirements
- Node.js 20.x or higher
- PostgreSQL 15+
- Redis 6+ (optional)
- 2GB RAM minimum
- 10GB storage

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd gs-cms-v05
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Setup Database**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   npx prisma db seed # Optional
   ```

5. **Build Application**
   ```bash
   npm run build
   ```

6. **Start Production Server**
   ```bash
   npm start
   # Or with PM2
   pm2 start npm --name "gs-cms" -- start
   ```

## 🐳 Docker Deployment

### Using Docker Compose

1. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=${DATABASE_URL}
         - NEXTAUTH_URL=${NEXTAUTH_URL}
         - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
       depends_on:
         - postgres
         - redis
     
     postgres:
       image: postgres:15
       environment:
         - POSTGRES_DB=gs_cms
         - POSTGRES_USER=postgres
         - POSTGRES_PASSWORD=postgres
       volumes:
         - postgres_data:/var/lib/postgresql/data
     
     redis:
       image: redis:7
       command: redis-server --appendonly yes
       volumes:
         - redis_data:/data
   
   volumes:
     postgres_data:
     redis_data:
   ```

2. **Build and Run**
   ```bash
   docker-compose up -d
   ```

## 🛡️ Security Checklist

- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Use HTTPS in production
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set secure headers
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Database backups configured

## 📊 Performance Optimization

### Database
- [x] Indexes created for common queries
- [ ] Connection pooling configured
- [ ] Query optimization implemented

### Caching
- [x] Redis caching implemented
- [ ] CDN for static assets
- [ ] Browser caching headers

### Application
- [x] Code splitting enabled
- [x] Dynamic imports used
- [ ] Image optimization configured

## 🔍 Monitoring

### Recommended Services
- **Application Monitoring**: Vercel Analytics, Sentry
- **Database Monitoring**: PostgreSQL logs, pgAdmin
- **Uptime Monitoring**: Better Uptime, Pingdom

### Health Check Endpoint
```bash
curl https://your-app.vercel.app/api/health
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL format
   - Verify database is accessible
   - Check SSL requirements

2. **Authentication Issues**
   - Verify NEXTAUTH_URL matches deployment URL
   - Check NEXTAUTH_SECRET is set
   - Clear browser cookies

3. **File Upload Issues**
   - Verify UploadThing credentials
   - Check file size limits
   - Ensure proper permissions

### Debug Mode
```env
# Add to environment variables
DEBUG=true
LOG_LEVEL=debug
```

## 📝 Maintenance

### Regular Tasks
- Database backups (daily)
- Security updates (weekly)
- Performance monitoring (ongoing)
- Log rotation (monthly)

### Update Process
1. Test updates in staging
2. Backup database
3. Deploy during low-traffic period
4. Monitor for issues
5. Rollback if needed

## 🆘 Support

For deployment issues:
1. Check deployment logs
2. Review error messages
3. Consult documentation
4. Contact support team

## 📋 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| NEXTAUTH_URL | Yes | Application URL |
| NEXTAUTH_SECRET | Yes | Auth encryption key |
| NEXT_PUBLIC_APP_URL | Yes | Public app URL |
| REDIS_URL | No | Redis connection string |
| UPLOADTHING_TOKEN | Yes | File upload token |
| UPLOADTHING_SECRET | Yes | File upload secret |
| EMAIL_* | No | Email configuration |
| ALLOWED_ORIGINS | No | CORS origins |

## 🎉 Post-Deployment

1. **Create Admin User**
   - Use database seed or manual creation
   - Secure admin credentials

2. **Configure Settings**
   - Company information
   - Email templates
   - Notification preferences

3. **Test Core Features**
   - User authentication
   - Inquiry creation
   - File uploads
   - Report generation

4. **Monitor Performance**
   - Check response times
   - Monitor error rates
   - Review resource usage

---

**Note**: This application is optimized for Vercel deployment but can be deployed to any Node.js hosting platform with proper configuration.