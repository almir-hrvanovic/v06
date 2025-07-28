# GS-CMS v05 Project Overview

## Purpose
Modern Customer Relationship & Quote Management System (CMS) for managing the complete workflow from customer inquiries through production orders with sophisticated role-based assignment system.

## Business Context
1. **Sales** creates inquiries with multiple items from customers
2. **VPP (VP Production)** assigns inquiry items to VPs with workload balancing
3. **VPs** calculate production costs and assign technical tasks to Tech Officers
4. **Managers** approve production costs with oversight
5. **Sales** applies margins and generates quotes
6. **System** converts approved quotes to production orders

## Key Features
- Role-based permissions (7 user roles: Superuser, Admin, Manager, Sales, VPP, VP, Tech)
- Real-time notifications and WebSocket updates
- File upload/management with UploadThing
- Advanced reporting and analytics
- Email notifications and workflow automation
- Comprehensive audit logging
- Excel and PDF export capabilities

## Current Status
- ✅ Production deployed on Vercel
- ✅ All technical debt resolved
- ✅ Docker and CI/CD ready
- 🔄 Ready for feature development