-- Performance indexes for GS-CMS database

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON "users"("email");
CREATE INDEX IF NOT EXISTS idx_users_role ON "users"("role");
CREATE INDEX IF NOT EXISTS idx_users_is_active ON "users"("isActive");

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON "customers"("name");
CREATE INDEX IF NOT EXISTS idx_customers_email ON "customers"("email");
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON "customers"("isActive");

-- Inquiry indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON "inquiries"("status");
CREATE INDEX IF NOT EXISTS idx_inquiries_priority ON "inquiries"("priority");
CREATE INDEX IF NOT EXISTS idx_inquiries_customer_id ON "inquiries"("customerId");
CREATE INDEX IF NOT EXISTS idx_inquiries_created_by_id ON "inquiries"("createdById");
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_to_id ON "inquiries"("assignedToId");
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON "inquiries"("createdAt");
CREATE INDEX IF NOT EXISTS idx_inquiries_deadline ON "inquiries"("deadline");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_inquiries_status_priority ON "inquiries"("status", "priority");
CREATE INDEX IF NOT EXISTS idx_inquiries_customer_status ON "inquiries"("customerId", "status");

-- Inquiry Item indexes
CREATE INDEX IF NOT EXISTS idx_inquiry_items_inquiry_id ON "inquiry_items"("inquiryId");
CREATE INDEX IF NOT EXISTS idx_inquiry_items_assigned_to_id ON "inquiry_items"("assignedToId");
CREATE INDEX IF NOT EXISTS idx_inquiry_items_status ON "inquiry_items"("status");
CREATE INDEX IF NOT EXISTS idx_inquiry_items_assigned_status ON "inquiry_items"("assignedToId", "status");

-- Cost Calculation indexes
CREATE INDEX IF NOT EXISTS idx_cost_calculations_inquiry_item_id ON "cost_calculations"("inquiryItemId");
CREATE INDEX IF NOT EXISTS idx_cost_calculations_calculated_by_id ON "cost_calculations"("calculatedById");
CREATE INDEX IF NOT EXISTS idx_cost_calculations_is_approved ON "cost_calculations"("isApproved");
CREATE INDEX IF NOT EXISTS idx_cost_calculations_created_at ON "cost_calculations"("createdAt");

-- Approval indexes
CREATE INDEX IF NOT EXISTS idx_approvals_cost_calculation_id ON "approvals"("costCalculationId");
CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON "approvals"("approverId");
CREATE INDEX IF NOT EXISTS idx_approvals_status ON "approvals"("status");
CREATE INDEX IF NOT EXISTS idx_approvals_type ON "approvals"("type");
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON "approvals"("createdAt");

-- Quote indexes
CREATE INDEX IF NOT EXISTS idx_quotes_inquiry_id ON "quotes"("inquiryId");
CREATE INDEX IF NOT EXISTS idx_quotes_generated_by_id ON "quotes"("generatedById");
CREATE INDEX IF NOT EXISTS idx_quotes_approved_by_id ON "quotes"("approvedById");
CREATE INDEX IF NOT EXISTS idx_quotes_status ON "quotes"("status");
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON "quotes"("validUntil");

-- Production Order indexes
CREATE INDEX IF NOT EXISTS idx_production_orders_quote_id ON "production_orders"("quoteId");
CREATE INDEX IF NOT EXISTS idx_production_orders_created_by_id ON "production_orders"("createdById");
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON "production_orders"("status");
CREATE INDEX IF NOT EXISTS idx_production_orders_scheduled_start ON "production_orders"("scheduledStart");

-- Production Item indexes
CREATE INDEX IF NOT EXISTS idx_production_items_production_order_id ON "production_items"("productionOrderId");
CREATE INDEX IF NOT EXISTS idx_production_items_inquiry_item_id ON "production_items"("inquiryItemId");
CREATE INDEX IF NOT EXISTS idx_production_items_status ON "production_items"("status");

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON "notifications"("isRead");
CREATE INDEX IF NOT EXISTS idx_notifications_type ON "notifications"("type");
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON "notifications"("createdAt");
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON "notifications"("userId", "isRead") WHERE "isRead" = false;

-- Audit Log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON "audit_logs"("entity");
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON "audit_logs"("entityId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON "audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_lookup ON "audit_logs"("entity", "entityId");

-- File Attachment indexes
CREATE INDEX IF NOT EXISTS idx_file_attachments_uploaded_by_id ON "file_attachments"("uploadedById");
CREATE INDEX IF NOT EXISTS idx_file_attachments_created_at ON "file_attachments"("createdAt");

-- Junction table indexes
CREATE INDEX IF NOT EXISTS idx_inquiry_attachments_inquiry_id ON "inquiry_attachments"("inquiryId");
CREATE INDEX IF NOT EXISTS idx_inquiry_attachments_attachment_id ON "inquiry_attachments"("attachmentId");

CREATE INDEX IF NOT EXISTS idx_item_attachments_item_id ON "item_attachments"("itemId");
CREATE INDEX IF NOT EXISTS idx_item_attachments_attachment_id ON "item_attachments"("attachmentId");

-- Text search indexes (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS idx_inquiries_title_gin ON "inquiries" USING gin(to_tsvector('english', "title"));
CREATE INDEX IF NOT EXISTS idx_inquiries_description_gin ON "inquiries" USING gin(to_tsvector('english', "description"));
CREATE INDEX IF NOT EXISTS idx_inquiry_items_name_gin ON "inquiry_items" USING gin(to_tsvector('english', "name"));
CREATE INDEX IF NOT EXISTS idx_inquiry_items_description_gin ON "inquiry_items" USING gin(to_tsvector('english', "description"));
CREATE INDEX IF NOT EXISTS idx_customers_name_gin ON "customers" USING gin(to_tsvector('english', "name"));

-- Performance statistics
ANALYZE;