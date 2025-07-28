# Production Login Troubleshooting Guide

## Common Login Issues on Vercel

### 1. Database Not Initialized
**Most Common Issue**: The production database doesn't have the required tables or seed data.

**Solution**:
```bash
# 1. Set your production DATABASE_URL locally
export DATABASE_URL="your-production-database-url"

# 2. Push the schema to production database
npx prisma db push

# 3. Seed with initial users (optional but recommended)
npx prisma db seed
```

### 2. Environment Variables Not Set
**Check in Vercel Dashboard**:
- Go to Project Settings → Environment Variables
- Ensure these are set:
  - `DATABASE_URL` - Must point to your production database
  - `NEXTAUTH_URL` - Must match your deployment URL (e.g., https://your-app.vercel.app)
  - `NEXTAUTH_SECRET` - Must be set (generate with: `openssl rand -base64 32`)

### 3. Database Connection Issues
**Common Problems**:
- SSL not enabled for production database
- Database firewall blocking Vercel IPs
- Wrong connection string format

**Fix DATABASE_URL format**:
```
# For Supabase/Neon/Railway (with SSL):
postgresql://user:password@host:5432/database?sslmode=require

# For connection pooling (recommended):
postgresql://user:password@host:6543/database?pgbouncer=true
```

### 4. Check Vercel Function Logs
1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Functions" tab
4. Check logs for `/api/auth/[...nextauth]`
5. Look for specific error messages

### 5. Test Authentication Locally with Production Database
```bash
# Create .env.production.local
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-production-secret"

# Run locally with production database
npm run dev
```

### 6. Quick Debug Checklist
- [ ] Database tables created (`npx prisma db push`)
- [ ] At least one user exists in database
- [ ] NEXTAUTH_URL matches deployment URL exactly
- [ ] NEXTAUTH_SECRET is set in Vercel
- [ ] DATABASE_URL has correct SSL settings
- [ ] No TypeScript errors in build logs

### 7. Emergency Fix - Create Admin User Directly
If you have database access, run this SQL:
```sql
INSERT INTO "User" (id, email, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'cltest123456789', 
  'admin@gs-cms.com', 
  'password123',  -- Remember to change this!
  'ADMIN', 
  true, 
  NOW(), 
  NOW()
);
```

### 8. Common Error Messages and Solutions

**"Unknown error occurred"**
- Usually database connection issue
- Check DATABASE_URL and SSL settings

**"User not found"**
- Database doesn't have users
- Run seed script or create user manually

**"Invalid credentials"**
- Check if user exists in database
- Verify password matches

**Page redirects to signin repeatedly**
- NEXTAUTH_URL mismatch
- Session not being created properly

## Need More Help?
1. Check Vercel Function logs for specific errors
2. Test with production database locally
3. Verify all environment variables are set correctly
4. Ensure database has been initialized with schema and users