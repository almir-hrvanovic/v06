# Dev Auto-Login Quick Reference

## 🚀 Quick Setup

### Automatic Setup (30 seconds)

#### 1. Add to `.env.local`
```env
NEXT_PUBLIC_DEV_AUTO_LOGIN=true
NEXT_PUBLIC_DEV_AUTO_LOGIN_EMAIL=almir.hrvanovic@icloud.com
DEV_AUTO_LOGIN_PASSWORD=your-password-here
```

#### 2. Start dev server
```bash
npm run dev
```

#### 3. Done! ✅
You're automatically logged in! No manual steps needed.

### Manual Setup (if no password)

#### 1. Add to `.env.local`
```env
NEXT_PUBLIC_DEV_AUTO_LOGIN=true
NEXT_PUBLIC_DEV_AUTO_LOGIN_EMAIL=almir.hrvanovic@icloud.com
```

#### 2. Start and login once
```bash
npm run dev:logged
# Then login manually at /auth/signin
```

## 📋 Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Regular dev server (with auto-login if enabled) |
| `npm run dev:logged` | Shows setup instructions + starts dev server |
| `npm run dev:full` | Dev server + Prisma Studio (with auto-login) |

## 🔍 Check Status

Look in browser console for:
```
🔐 DEV AUTO-LOGIN ENABLED
✅ Automatic login successful!
✅ Dev session active: almir.hrvanovic@icloud.com
```

## ❌ Disable

In `.env.local`:
```env
NEXT_PUBLIC_DEV_AUTO_LOGIN=false
```

## ⚠️ Security

- **DEVELOPMENT ONLY**
- Never use in production
- Don't commit `.env.local`

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| No console messages | Restart server after adding env vars |
| "No session found" | Login manually once |
| Wrong user | Sign out, login with dev email |

---

Full docs: [DEV_AUTO_LOGIN.md](./DEV_AUTO_LOGIN.md)