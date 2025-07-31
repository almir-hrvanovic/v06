-- Add indexes for performance optimization

-- Index for InquiryItem queries by assignedToId and status
CREATE INDEX IF NOT EXISTS "inquiry_items_assignedToId_status_idx" ON "inquiry_items" ("assignedToId", "status");

-- Index for InquiryItem queries by status only
CREATE INDEX IF NOT EXISTS "inquiry_items_status_idx" ON "inquiry_items" ("status");

-- Index for InquiryItem queries by updatedAt (for time-based queries)
CREATE INDEX IF NOT EXISTS "inquiry_items_updatedAt_idx" ON "inquiry_items" ("updatedAt");

-- Index for InquiryItem queries by createdAt (for trend analysis)
CREATE INDEX IF NOT EXISTS "inquiry_items_createdAt_idx" ON "inquiry_items" ("createdAt");

-- Composite index for finding items by assignedToId with date range
CREATE INDEX IF NOT EXISTS "inquiry_items_assignedToId_updatedAt_idx" ON "inquiry_items" ("assignedToId", "updatedAt");

-- Index for User queries by role and isActive
CREATE INDEX IF NOT EXISTS "users_role_isActive_idx" ON "users" ("role", "isActive");

-- Index for Inquiry queries by status
CREATE INDEX IF NOT EXISTS "inquiries_status_idx" ON "inquiries" ("status");

-- Index for Inquiry queries by customerId
CREATE INDEX IF NOT EXISTS "inquiries_customerId_idx" ON "inquiries" ("customerId");

-- Analyze tables to update statistics
ANALYZE "inquiry_items";
ANALYZE "users";
ANALYZE "inquiries";