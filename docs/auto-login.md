# Auto-Login Feature for Development

## Overview
The auto-login feature automatically signs in with default credentials when the application starts in development mode. This saves time during development by eliminating the need to manually log in after each server restart.

## Default Credentials
- **Email**: `almir@al-star.im`
- **Password**: `password123`

## Usage

### Method 1: Auto-Login on App Start (Client-Side)
The app will automatically attempt to log in when you navigate to it in your browser if:
1. You're in development mode (`NODE_ENV !== 'production'`)
2. Auto-login is enabled in `.env.local`: `NEXT_PUBLIC_AUTO_LOGIN=true`
3. You're not already logged in

### Method 2: Start Server with Auto-Login (Recommended)
```bash
npm run dev:auto
```
This command:
1. Starts the Next.js development server
2. Waits for the server to be ready
3. Automatically logs in with default credentials
4. Opens the dashboard

### Method 3: Manual Auto-Login
If the server is already running, you can trigger auto-login manually:
```bash
npm run auto-login
```

## Configuration

### Environment Variables
Add to `.env.local`:
```env
# Enable auto-login for development
NEXT_PUBLIC_AUTO_LOGIN=true
```

### Disable Auto-Login
To disable auto-login, either:
1. Set `NEXT_PUBLIC_AUTO_LOGIN=false` in `.env.local`
2. Remove the `NEXT_PUBLIC_AUTO_LOGIN` variable
3. Use regular `npm run dev` instead of `npm run dev:auto`

## How It Works

### Client-Side Auto-Login
1. `AutoLoginProvider` component checks if user is not authenticated
2. Calls `autoLoginDevelopment()` function with default credentials
3. Uses NextAuth.js `signIn` method
4. Redirects to dashboard on success

### Server-Side Auto-Login Script
1. Waits for server to be ready (checks `/api/health`)
2. Gets CSRF token from `/api/auth/csrf`
3. Posts credentials to `/api/auth/callback/credentials`
4. Logs success/failure to console

## Security Notes
- **Only works in development mode** - disabled in production
- Credentials are hardcoded for development convenience
- Should never be used with production data
- Consider changing default password if using with sensitive test data

## Troubleshooting

### Auto-login not working?
1. Check if `NEXT_PUBLIC_AUTO_LOGIN=true` is set
2. Restart the server after changing environment variables
3. Check console for error messages
4. Ensure the user `almir@al-star.im` exists in the database

### Server not starting?
1. Check if port 3000 is already in use
2. Run `npm install` to ensure dependencies are installed
3. Check for any build errors

## Related Files
- `/src/lib/auto-login.ts` - Auto-login logic
- `/src/components/auth/auto-login-provider.tsx` - React component
- `/scripts/auto-login.js` - Node.js script for server-side login
- `/scripts/dev-with-auto-login.sh` - Bash script to start server with auto-login