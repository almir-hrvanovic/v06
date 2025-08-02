# Development Auto-Login System

## Overview

The Development Auto-Login system helps maintain a persistent session during development, eliminating the need to repeatedly log in after server restarts. This feature is designed with security in mind and only works in development mode.

## 🚨 Security Warning

**This feature is for DEVELOPMENT ONLY!**
- Never use in production environments
- Always ensure `NEXT_PUBLIC_DEV_AUTO_LOGIN=false` in production
- The system will not activate if `NODE_ENV=production`

## How It Works

1. **Environment Detection**: The system checks if running in development mode
2. **Configuration Check**: Verifies if dev auto-login is enabled via environment variables
3. **Session Monitoring**: Monitors the current Supabase session
4. **Console Warnings**: Displays clear warnings when dev auto-login is active
5. **Session Persistence**: Maintains the session for the configured dev user

## Configuration

### Environment Variables

Add to your `.env.local` file:

```env
# Development Auto-Login (NEVER use in production)
NEXT_PUBLIC_DEV_AUTO_LOGIN=true
NEXT_PUBLIC_DEV_AUTO_LOGIN_EMAIL=almir.hrvanovic@icloud.com
DEV_AUTO_LOGIN_PASSWORD=your-password-here  # Optional but recommended
```

### Initial Setup

#### Option 1: With Password (Recommended)
1. **Configure all variables**: Including `DEV_AUTO_LOGIN_PASSWORD`
2. **Start the dev server**: 
   ```bash
   npm run dev
   ```
3. **Automatic login**: The system will automatically log you in on first page load
4. **Session persists**: No manual intervention needed!

#### Option 2: Without Password
1. **Configure email only**: Leave out `DEV_AUTO_LOGIN_PASSWORD`
2. **Start the dev server**: 
   ```bash
   npm run dev:logged  # Shows setup instructions
   ```
3. **Check browser console**: Look for dev auto-login messages
4. **Manual login (one time)**:
   - Navigate to http://localhost:3000/auth/signin
   - Login with your configured email
   - Use your Supabase password
5. **Session persists**: After initial login, your session will persist

## Usage

### Option 1: Regular Dev Server
```bash
npm run dev
```
The DevAutoLoginProvider will automatically maintain your session.

### Option 2: Dev Server with Instructions
```bash
npm run dev:logged
```
This shows setup instructions before starting the server.

### Option 3: Dev Server with Prisma Studio
```bash
npm run dev:full
```
Runs both Next.js and Prisma Studio with auto-login enabled.

## Console Messages

When dev auto-login is active, you'll see these messages in your browser console:

```
🔐 DEV AUTO-LOGIN ENABLED
📧 Dev Email: almir.hrvanovic@icloud.com
⚠️  This is for DEVELOPMENT ONLY!
⚠️  Make sure DEV_AUTO_LOGIN is set to false in production!
```

Session status messages:
- `✅ Dev session active: [email]` - You're logged in correctly
- `❌ No session found` → `🔑 Attempting automatic login...` - System will try to log you in
- `✅ Automatic login successful!` - Password login worked
- `❌ Automatic login failed` - Check your password configuration
- `⚠️  Logged in as different user: [email]` - Wrong user is logged in

## Technical Implementation

### Components

1. **`/src/hooks/use-dev-auto-login.ts`**
   - React hook that monitors and maintains the session
   - Only activates in development mode
   - Provides session status and warnings

2. **`/src/components/auth/dev-auto-login-provider.tsx`**
   - Wrapper component that uses the auto-login hook
   - Added to the root layout to monitor the entire app

3. **`/src/lib/dev-auto-login.ts`**
   - Core service functions for auto-login logic
   - Checks environment configuration
   - Reserved for future enhancements

4. **`/scripts/dev-auto-login.js`**
   - Node.js script that shows setup instructions
   - Verifies configuration
   - Indicates if password is configured

5. **`/src/app/api/dev-auto-login/route.ts`**
   - Server-side API endpoint
   - Handles password-based authentication
   - Reads password from server environment variables

### Architecture

```
Root Layout
  └── AuthProvider (Supabase)
      └── DevAutoLoginProvider
          └── useDevAutoLogin hook
              ├── Checks environment
              ├── Monitors session
              ├── Calls /api/dev-auto-login (if no session)
              └── Maintains login state
```

### Authentication Flow

1. **Page Load**: DevAutoLoginProvider initializes
2. **Session Check**: Hook checks for existing Supabase session
3. **No Session?**: 
   - Hook calls `/api/dev-auto-login`
   - API reads password from server environment
   - API attempts Supabase authentication
   - Success: Page reloads with session
   - Failure: Console shows instructions
4. **Session Exists**: No action needed

## Troubleshooting

### Auto-login not working?

1. **Check environment variables**:
   ```bash
   echo $NEXT_PUBLIC_DEV_AUTO_LOGIN
   echo $NEXT_PUBLIC_DEV_AUTO_LOGIN_EMAIL
   ```

2. **Restart the server** after changing environment variables

3. **Check browser console** for error messages

4. **Verify user exists** in the database with SUPERUSER role

5. **Clear browser cookies** if session is corrupted

### Common Issues

| Issue | Solution |
|-------|----------|
| No console messages | Check if `NEXT_PUBLIC_DEV_AUTO_LOGIN=true` is set |
| "No session found" message | Login manually once at /auth/signin |
| Wrong user logged in | Sign out and login with dev email |
| Session not persisting | Check Supabase auth settings |

## Current Features

✅ **Automatic Password Login**: Fully implemented
- Reads password from `DEV_AUTO_LOGIN_PASSWORD`
- Automatically signs in on page load
- No manual intervention required

## Future Enhancements

The system could be extended with:

1. **Multiple dev users**: Support for team development
2. **Session refresh**: Automatic token refresh
3. **Role switching**: Quick switch between different user roles
4. **Team profiles**: Shared dev configurations

## Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Use different passwords** for dev and production
3. **Disable in staging**: Ensure it's off in all non-dev environments
4. **Regular audits**: Check that production builds don't include dev features
5. **Team awareness**: Ensure all developers understand this is dev-only

## Related Files

- `/src/hooks/use-dev-auto-login.ts` - Main hook implementation
- `/src/components/auth/dev-auto-login-provider.tsx` - Provider component
- `/src/lib/dev-auto-login.ts` - Core service logic
- `/scripts/dev-auto-login.js` - Setup script
- `.env.local` - Configuration (not committed)

---

**Remember**: This feature is a development convenience tool. Always prioritize security and ensure it's disabled in production environments.