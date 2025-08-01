-- Production Database Setup Script
-- This script should be run on the production Supabase database

-- Step 1: Create all tables (schema from Prisma)
-- Note: This assumes the production database is fresh/empty

-- Create enums
CREATE TYPE "UserRole" AS ENUM ('SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH', 'VIEWER');
CREATE TYPE "InquiryStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'ASSIGNED', 'COSTING', 'QUOTED', 'APPROVED', 'REJECTED', 'CONVERTED');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "ItemStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COSTED', 'APPROVED', 'QUOTED');
CREATE TYPE "ApprovalType" AS ENUM ('COST_CALCULATION', 'QUOTE', 'PRODUCTION_ORDER');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_REVISION');
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');
CREATE TYPE "ProductionOrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ProductionItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED');
CREATE TYPE "NotificationType" AS ENUM ('INQUIRY_ASSIGNED', 'COST_CALCULATION_REQUESTED', 'APPROVAL_REQUIRED', 'QUOTE_GENERATED', 'PRODUCTION_ORDER_CREATED', 'DEADLINE_REMINDER', 'STATUS_UPDATE');
CREATE TYPE "AutomationTrigger" AS ENUM ('INQUIRY_CREATED', 'INQUIRY_STATUS_CHANGED', 'ITEM_ASSIGNED', 'COST_CALCULATED', 'APPROVAL_REQUIRED', 'QUOTE_CREATED', 'DEADLINE_APPROACHING', 'WORKLOAD_THRESHOLD', 'PRODUCTION_ORDER_CREATED');
CREATE TYPE "AutomationLogStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL', 'SKIPPED');
CREATE TYPE "DeadlineEntity" AS ENUM ('INQUIRY', 'INQUIRY_ITEM', 'QUOTE', 'PRODUCTION_ORDER');
CREATE TYPE "DeadlineStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'OVERDUE', 'CANCELLED');
CREATE TYPE "Currency" AS ENUM ('EUR', 'BAM', 'USD', 'GBP', 'CHF', 'HRK', 'RSD');
CREATE TYPE "StorageProvider" AS ENUM ('UPLOADTHING', 'LOCAL');

-- Create users table
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'SALES',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'hr-HR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Create customers table
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "contactPerson" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- Create inquiries table
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "deadline" TIMESTAMP(3),
    "totalValue" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- Create inquiry_items table
CREATE TABLE "inquiry_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "requestedDelivery" TIMESTAMP(3),
    "priceEstimation" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inquiryId" TEXT NOT NULL,
    "assignedToId" TEXT,

    CONSTRAINT "inquiry_items_pkey" PRIMARY KEY ("id")
);

-- Create cost_calculations table
CREATE TABLE "cost_calculations" (
    "id" TEXT NOT NULL,
    "materialCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "laborCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "overheadCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "materialCostCurrency" "Currency" NOT NULL DEFAULT 'EUR',
    "laborCostCurrency" "Currency" NOT NULL DEFAULT 'EUR',
    "overheadCostCurrency" "Currency" NOT NULL DEFAULT 'EUR',
    "materialCostOriginal" DECIMAL(10,2),
    "laborCostOriginal" DECIMAL(10,2),
    "overheadCostOriginal" DECIMAL(10,2),
    "materialCostRate" DECIMAL(8,6),
    "laborCostRate" DECIMAL(8,6),
    "overheadCostRate" DECIMAL(8,6),
    "notes" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inquiryItemId" TEXT NOT NULL,
    "calculatedById" TEXT NOT NULL,

    CONSTRAINT "cost_calculations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cost_calculations_inquiryItemId_key" ON "cost_calculations"("inquiryItemId");

-- Create approvals table
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approverId" TEXT NOT NULL,
    "costCalculationId" TEXT,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- Create quotes table
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "margin" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "total" DECIMAL(12,2) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "terms" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inquiryId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quotes_quoteNumber_key" ON "quotes"("quoteNumber");

-- Create production_orders table
CREATE TABLE "production_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProductionOrderStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "totalValue" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quoteId" TEXT NOT NULL,

    CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "production_orders_orderNumber_key" ON "production_orders"("orderNumber");
CREATE UNIQUE INDEX "production_orders_quoteId_key" ON "production_orders"("quoteId");

-- Create production_items table
CREATE TABLE "production_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT,
    "status" "ProductionItemStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productionOrderId" TEXT NOT NULL,
    "inquiryItemId" TEXT NOT NULL,

    CONSTRAINT "production_items_pkey" PRIMARY KEY ("id")
);

-- Create notifications table
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Create audit_logs table
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "inquiryId" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Create file_attachments table
CREATE TABLE "file_attachments" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadThingKey" TEXT NOT NULL DEFAULT '',
    "uploadThingUrl" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "folderPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_attachments_pkey" PRIMARY KEY ("id")
);

-- Create inquiry_attachments table
CREATE TABLE "inquiry_attachments" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inquiry_attachments_inquiryId_attachmentId_key" ON "inquiry_attachments"("inquiryId", "attachmentId");

-- Create item_attachments table
CREATE TABLE "item_attachments" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "item_attachments_itemId_attachmentId_key" ON "item_attachments"("itemId", "attachmentId");

-- Create automation_rules table
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trigger" "AutomationTrigger" NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "automation_rules_trigger_isActive_idx" ON "automation_rules"("trigger", "isActive");

-- Create automation_logs table
CREATE TABLE "automation_logs" (
    "id" TEXT NOT NULL,
    "status" "AutomationLogStatus" NOT NULL,
    "message" TEXT,
    "errorDetails" TEXT,
    "executionTime" INTEGER NOT NULL,
    "triggeredData" JSONB,
    "executedActions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ruleId" TEXT NOT NULL,
    "executedById" TEXT,

    CONSTRAINT "automation_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "automation_logs_ruleId_createdAt_idx" ON "automation_logs"("ruleId", "createdAt");

-- Create email_templates table
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "variables" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_templates_name_key" ON "email_templates"("name");

-- Create deadlines table
CREATE TABLE "deadlines" (
    "id" TEXT NOT NULL,
    "entityType" "DeadlineEntity" NOT NULL,
    "entityId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "warningDate" TIMESTAMP(3),
    "escalationDate" TIMESTAMP(3),
    "status" "DeadlineStatus" NOT NULL DEFAULT 'ACTIVE',
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deadlines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deadlines_entityType_entityId_key" ON "deadlines"("entityType", "entityId");
CREATE INDEX "deadlines_status_dueDate_idx" ON "deadlines"("status", "dueDate");

-- Create business_partners table
CREATE TABLE "business_partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_partners_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_partners_name_key" ON "business_partners"("name");

-- Create system_settings table
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "mainCurrency" "Currency" NOT NULL DEFAULT 'EUR',
    "additionalCurrency1" "Currency",
    "additionalCurrency2" "Currency",
    "exchangeRate1" DECIMAL(10,6),
    "exchangeRate2" DECIMAL(10,6),
    "storageProvider" "StorageProvider" NOT NULL DEFAULT 'UPLOADTHING',
    "uploadThingToken" TEXT,
    "uploadThingAppId" TEXT,
    "localStoragePath" TEXT DEFAULT './uploads',
    "maxFileSize" INTEGER NOT NULL DEFAULT 16777216,
    "allowedFileTypes" TEXT[] DEFAULT ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "customers" ADD CONSTRAINT "customers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inquiry_items" ADD CONSTRAINT "inquiry_items_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inquiry_items" ADD CONSTRAINT "inquiry_items_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cost_calculations" ADD CONSTRAINT "cost_calculations_inquiryItemId_fkey" FOREIGN KEY ("inquiryItemId") REFERENCES "inquiry_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cost_calculations" ADD CONSTRAINT "cost_calculations_calculatedById_fkey" FOREIGN KEY ("calculatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_costCalculationId_fkey" FOREIGN KEY ("costCalculationId") REFERENCES "cost_calculations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "production_items" ADD CONSTRAINT "production_items_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "production_items" ADD CONSTRAINT "production_items_inquiryItemId_fkey" FOREIGN KEY ("inquiryItemId") REFERENCES "inquiry_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inquiry_attachments" ADD CONSTRAINT "inquiry_attachments_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inquiry_attachments" ADD CONSTRAINT "inquiry_attachments_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "file_attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "item_attachments" ADD CONSTRAINT "item_attachments_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inquiry_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "item_attachments" ADD CONSTRAINT "item_attachments_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "file_attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "automation_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 2: Create trigger function for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updatedAt triggers to all tables that have updatedAt column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON "customers" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON "inquiries" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inquiry_items_updated_at BEFORE UPDATE ON "inquiry_items" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cost_calculations_updated_at BEFORE UPDATE ON "cost_calculations" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON "approvals" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON "quotes" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_production_orders_updated_at BEFORE UPDATE ON "production_orders" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_production_items_updated_at BEFORE UPDATE ON "production_items" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON "automation_rules" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deadlines_updated_at BEFORE UPDATE ON "deadlines" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON "email_templates" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_partners_updated_at BEFORE UPDATE ON "business_partners" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON "system_settings" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_file_attachments_updated_at BEFORE UPDATE ON "file_attachments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 3: Insert the user data
INSERT INTO "users" (
    "id",
    "email",
    "name",
    "role",
    "isActive",
    "preferredLanguage",
    "createdAt",
    "updatedAt"
) VALUES (
    'cm6mowgql0001z44bv6ywqmcw', -- From development database
    'almir.hrvanovic@icloud.com',
    'Almir Hrvanovic',
    'SUPERUSER',
    true,
    'hr-HR',
    NOW(),
    NOW()
);

-- Step 4: Initialize system settings
INSERT INTO "system_settings" (
    "id",
    "mainCurrency",
    "additionalCurrency1",
    "additionalCurrency2",
    "exchangeRate1",
    "exchangeRate2",
    "storageProvider",
    "updatedAt"
) VALUES (
    'default',
    'EUR',
    'BAM',
    'USD',
    1.95583,
    0.9,
    'UPLOADTHING',
    NOW()
) ON CONFLICT DO NOTHING;

-- Step 5: Grant permissions (optional - Supabase handles this automatically)
-- But we'll ensure RLS is disabled for now (you can enable it later)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inquiries" ENABLE ROW LEVEL SECURITY;
-- ... add more as needed

-- Create basic RLS policies for users table
CREATE POLICY "Users can view their own profile" ON "users"
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Admins can view all users" ON "users"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "users" 
            WHERE id = auth.uid()::text 
            AND role IN ('SUPERUSER', 'ADMIN')
        )
    );

-- Done!
-- The production database is now set up with:
-- 1. Complete schema from Prisma
-- 2. The user almir.hrvanovic@icloud.com with SUPERUSER role
-- 3. System settings initialized
-- 4. Basic RLS policies