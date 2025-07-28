# User Management System

This document describes the fully functional user management system with enhanced features, copy-to-clipboard functionality, and robust error handling.

## 🔐 How to Log In

### Default Users
The system comes with seeded demo users. You can log in with any of these credentials:

- **Admin**: admin@gs-cms.com / password123
- **Manager**: manager@gs-cms.com / password123  
- **Sales**: sales@gs-cms.com / password123
- **VPP**: vpp@gs-cms.com / password123
- **VP1**: vp1@gs-cms.com / password123
- **VP2**: vp2@gs-cms.com / password123

### Login Process
1. Go to `http://localhost:3000`
2. You'll be redirected to the login page
3. Enter one of the demo credentials above
4. You'll be logged in and redirected to the dashboard

## 👥 User Management Features

### Access the Users Page
Navigate to `http://localhost:3000/dashboard/users` (requires admin/superuser permissions)

### Creating New Users
1. Click the "Add User" button
2. Fill in the form:
   - **Name**: Full name of the user
   - **Email**: Must be unique in the system
   - **Role**: Select from available roles (SUPERUSER, ADMIN, MANAGER, SALES, VPP, VP, TECH)
3. Click "Create User"
4. **Copy Password**: The system shows a temporary password notification with a **copy button** for easy clipboard copying
5. **Duration**: Password notification displays for 15 seconds with copy functionality

### User Actions
For each user in the table, you can:
- **Edit** (pencil icon): Update user information (name, email, role)
- **Reset Password** (key icon): Generate a new temporary password with copy button
- **Toggle Status** (checkmark/X icon): Activate or deactivate the user

### Enhanced Notifications with Copy Functionality ✨
- **User Creation**: Shows temporary password for 15 seconds with copy button
- **Password Reset**: Shows new temporary password for 20 seconds with copy button
- **Copy Success**: Confirms when password is copied to clipboard
- **Proper Error Messages**: Clear feedback on what went wrong

## 🔑 Password Management

### Temporary Passwords
- New users get a random 8-character temporary password
- Passwords are hashed using bcrypt (strength: 12 rounds) before storage
- Users should change their password after first login (future enhancement)

### Password Reset with Copy Functionality
1. Click the key icon next to any user
2. Confirm the action in the confirmation dialog
3. A new temporary password will be generated and displayed in a notification
4. **Click the copy button** to copy the password to your clipboard
5. Share the new password securely with the user
6. **Success feedback**: System confirms when password is copied successfully

## 🛡️ Permissions & Authorization

### Role Hierarchy
- **SUPERUSER**: Full system access
- **ADMIN**: User management, system configuration
- **MANAGER**: Approvals, reporting, oversight
- **SALES**: Customer and inquiry management
- **VPP**: Item assignment to VPs
- **VP**: Cost calculations, tech assignments
- **TECH**: Technical tasks and documentation

### User Management Permissions
- **View Users**: Admin, Superuser
- **Create Users**: Admin, Superuser
- **Edit Users**: Admin, Superuser
- **Delete/Deactivate Users**: Admin, Superuser
- **Reset Passwords**: Admin, Superuser

### Self-Protection
- Users cannot edit their own role
- Users cannot deactivate themselves
- Users cannot reset their own password through admin interface

## 🔧 Technical Details

### API Endpoints
- `GET /api/users` - List all users (with filtering)
- `POST /api/users` - Create new user
- `GET /api/users/[id]` - Get specific user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Soft delete (deactivate) user
- `POST /api/users/[id]/reset-password` - Reset user password

### Authentication
- Uses NextAuth.js with credentials provider
- JWT-based sessions
- Proper password hashing with bcrypt
- Session-based authorization checks

### Database
- Users are stored in PostgreSQL via Prisma
- Soft delete implemented (isActive flag)
- Full audit trail for all user operations
- Unique email constraint

## 🚀 Recent Enhancements (Updated: 2025-01-25)

### Fixed Issues
✅ **500 Error on User Creation**: Fixed authentication imports and bcrypt usage
✅ **500 Error on Password Reset**: Resolved Next.js 15 async params and foreign key constraints
✅ **Edit User Functionality**: Fixed dialog not opening when clicking edit button
✅ **Notification Problems**: Enhanced with proper success/error messages and password display
✅ **Authentication Flow**: Proper session handling and permission checks
✅ **Database Persistence**: Users are permanently stored with proper foreign key handling
✅ **Audit Log Constraints**: Gracefully handles session user validation

### New Features
✅ **Copy-to-Clipboard**: One-click password copying with visual feedback
✅ **Enhanced Edit Dialog**: Separate dialogs for create and edit operations
✅ **Password Reset Button**: Easy password reset with confirmation dialog
✅ **Extended Notifications**: 15-20 second display duration for passwords
✅ **Better Error Handling**: Detailed error messages with user-friendly feedback
✅ **Self-Protection**: Prevent users from breaking their own access
✅ **Tooltips**: Helpful button descriptions
✅ **Next.js 15 Compatibility**: Full support for async route parameters

## 📝 Future Enhancements

- **Email Integration**: Send temporary passwords via email
- **Password Change UI**: Allow users to change their own passwords
- **Two-Factor Authentication**: Additional security layer
- **Password Policies**: Enforce strong password requirements
- **User Sessions Management**: View and revoke active sessions
- **Bulk User Operations**: Import/export users

## 🐛 Troubleshooting

### "Cannot log in"
- Verify the credentials are correct (case-sensitive)
- Check if the user account is active
- Ensure the database is running and seeded
- Run `npx prisma db push && npm run db:seed` if database is empty

### "Edit button not working"
- Fixed: Edit dialog now opens properly when clicking pencil icon
- Each user has independent edit dialog functionality
- Form pre-fills with current user data

### "Copy to clipboard not working"
- Ensure you're using HTTPS or localhost (required for clipboard API)
- Check browser permissions for clipboard access
- Modern browsers support automatic clipboard copying

### "Database persistence issues"
- Users are permanently stored in PostgreSQL database
- Check `DATABASE_URL` in your `.env.local` file
- Avoid running `npx prisma db push --force-reset` (deletes all data)

### "WebSocket warnings"
- These are harmless - WebSocket functionality is intentionally disabled
- Will be implemented in future updates for real-time notifications

### "Unauthorized" errors
- User doesn't have sufficient permissions for the action
- Check user role and permission matrix above

### "Audit log errors"
- System gracefully handles session user validation
- Audit logs are created when session user exists in database
- Core functionality continues even if audit logging fails