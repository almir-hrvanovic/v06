# API Authentication Migration Plan

## Overview
We need to migrate all API routes from the old `getAuthenticatedUser` to the new `getAuthenticatedUserFromRequest` function to fix authentication issues and improve performance.

## Current Status
- ✅ Created new auth helper: `getAuthenticatedUserFromRequest` in `/src/utils/supabase/api-helpers.ts`
- ✅ Updated critical routes: `/api/users/me`, `/api/system-settings`, `/api/notifications`
- ❌ 44+ routes still need updating

## Migration Pattern

### Old Pattern
```typescript
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

const user = await getAuthenticatedUser(request)
```

### New Pattern
```typescript
import { getAuthenticatedUserFromRequest } from '@/utils/supabase/api-helpers'

const user = await getAuthenticatedUserFromRequest(request)
```

## API Routes by Category

### 1. User Management (High Priority)
- [x] `/api/users/me` - ✅ Already updated
- [ ] `/api/users`
- [ ] `/api/users/[id]`
- [ ] `/api/users/[id]/toggle-active`
- [ ] `/api/users/[id]/language`
- [ ] `/api/users/[id]/reset-password`
- [ ] `/api/user/language`
- [ ] `/api/users/language`

### 2. Core Business Logic (High Priority)
- [ ] `/api/customers`
- [ ] `/api/customers/[id]`
- [ ] `/api/quotes`
- [ ] `/api/quotes/[id]/send`
- [ ] `/api/production-orders`
- [ ] `/api/production-orders/[id]/status`
- [ ] `/api/inquiries/[id]`
- [ ] `/api/business-partners`
- [ ] `/api/business-partners/[id]`

### 3. Items & Inventory (Medium Priority)
- [ ] `/api/items`
- [ ] `/api/items/[id]`
- [ ] `/api/items/assign`
- [ ] `/api/items/unassign`

### 4. File & Document Management (Medium Priority)
- [ ] `/api/files/[...path]`
- [ ] `/api/attachments`
- [ ] `/api/upload/local`
- [ ] `/api/uploadthing/test`
- [ ] `/api/inquiries/[id]/documents`
- [ ] `/api/inquiries/[id]/documents/open`
- [ ] `/api/inquiries/[id]/documents/browse`
- [ ] `/api/inquiries/[id]/documents/download`

### 5. Export & Reporting (Medium Priority)
- [ ] `/api/excel/customers`
- [ ] `/api/excel/inquiries`
- [ ] `/api/excel/users`
- [ ] `/api/pdf/report`
- [ ] `/api/pdf/quote`
- [ ] `/api/analytics`
- [ ] `/api/analytics/workload`
- [ ] `/api/analytics/workload-optimized`
- [ ] `/api/analytics/export`

### 6. Utility & Admin (Low Priority)
- [ ] `/api/search`
- [ ] `/api/cache/stats`
- [ ] `/api/workload/[userId]`
- [ ] `/api/costs`
- [ ] `/api/approvals`
- [ ] `/api/automation/rules`
- [ ] `/api/automation/rules/[ruleId]`

## Implementation Steps

### Phase 1: Critical Routes (Completed ✅)
1. Update authentication helper
2. Fix `/api/users/me`, `/api/system-settings`, `/api/notifications`

### Phase 2: User & Core Business Routes
1. Update all user management routes
2. Update customer, quote, and order routes
3. Test user flows end-to-end

### Phase 3: Data Management Routes
1. Update item and inventory routes
2. Update file handling routes
3. Ensure file uploads work correctly

### Phase 4: Reporting & Analytics
1. Update all export routes
2. Update analytics endpoints
3. Verify reports generate correctly

### Phase 5: Final Cleanup
1. Update remaining utility routes
2. Remove old `getAuthenticatedUser` function
3. Update middleware if needed

## Testing Plan

### Unit Tests
- Test each updated route individually
- Verify authentication works
- Check error handling

### Integration Tests
- Test complete user flows
- Verify API chains work correctly
- Test with different user roles

### Performance Tests
- Measure API response times
- Check for any performance regressions
- Verify caching works properly

## Risk Mitigation

1. **Gradual Migration**: Update routes in phases, not all at once
2. **Backward Compatibility**: Keep old function until all routes updated
3. **Monitoring**: Watch for 401 errors in production
4. **Rollback Plan**: Can revert individual routes if issues arise

## Success Criteria

- [ ] All API routes use new auth helper
- [ ] No more 401 errors on valid requests
- [ ] Dashboard loads without flashing
- [ ] API response times improved
- [ ] All tests passing

## Notes

- The new auth helper is simpler and more reliable
- It properly handles Supabase session cookies
- Reduces complexity in API routes
- Better error handling and logging