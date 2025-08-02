# Development Environment Startup Guide

## 🚀 Quick Start Commands

### Option 1: Run Everything Together (Recommended)
```bash
npm run dev:full
```
This starts both Next.js (port 3000) and Prisma Studio (port 5555) simultaneously.

### Option 2: Run with Custom Script
```bash
npm run dev:studio
```
This uses a custom script with nice formatting and startup messages.

### Option 3: Run Separately
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run db:studio
```

## 📍 Access Points

- **Next.js App**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555

## 🔑 Test Users

| Role | Email | Password |
|------|-------|----------|
| VPP | vpp@metalworks.com | password123 |
| VP | vp1@metalworks.com | password123 |
| VP | vp2@metalworks.com | password123 |
| SALES | sales@metalworks.com | password123 |

## 🛠️ Prisma Studio Features

- View and edit all database tables
- Filter and sort data
- Create new records
- Delete records
- Export data

## 💡 Tips

1. Prisma Studio auto-refreshes when you make changes
2. You can open multiple Prisma Studio tabs for different tables
3. Use filters in Prisma Studio to find specific records quickly
4. The "SQL" tab in Prisma Studio shows the actual SQL queries being run