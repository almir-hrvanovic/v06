# ⚠️ AUTO-LOGIN HAS BEEN DISABLED

## Security Notice
The auto-login functionality has been permanently disabled for security reasons.

## What was removed:
1. **AutoLoginProvider** - Removed from `/src/app/layout.tsx`
2. **auto-login.js** - Renamed to `auto-login.js.disabled`
3. **dev-with-auto-login.sh** - Renamed to `dev-with-auto-login.sh.disabled`
4. **npm scripts** - `dev:auto` and `auto-login` now show warning messages

## Why it was disabled:
- Auto-login bypasses authentication security
- It could allow unauthorized access in production
- Manual login ensures proper authentication flow

## How to use the app now:
1. Start the dev server: `npm run dev`
2. Go to: http://localhost:3000/auth/signin
3. Sign in with your credentials
4. The session will persist until you sign out

## Test Credentials:
- Email: almir.hrvanovic@icloud.com
- Password: QG'"^Ukj:_9~%9F

**DO NOT re-enable auto-login in production environments!**