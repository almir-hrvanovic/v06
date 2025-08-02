# Database Schema Documentation

## Overview
This document describes the database schema for the GS-CMS v06 project. The database uses PostgreSQL with Prisma ORM.

## Key Design Decisions

### Sequential Numbering
- **Inquiry.sequentialNumber**: Each inquiry has a unique sequential number that auto-increments
- This provides a human-friendly reference number (e.g., INQ-0001, INQ-0002)
- The field is indexed for fast lookups when generating new numbers

## Core Models

### User
Primary user model for authentication and authorization.

```prisma
model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  name                  String?
  password              String?   // Hashed in production
  role                  UserRole  @default(SALES)
  isActive              Boolean   @default(true)
  preferredLanguage     String    @default("en-US")
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

**Roles:**
- `SUPERUSER`: Full system access
- `ADMIN`: User management and configuration
- `MANAGER`: Approvals and oversight
- `SALES`: Create inquiries and manage customers
- `VPP`: Senior Project Manager - Item assignment and production planning
- `VP`: Project Manager - Cost calculations and technical assignments
- `TECH`: Technical analysis

### Customer
Customer/company information for inquiries and quotes.

```prisma
model Customer {
  id          String    @id @default(cuid())
  name        String
  email       String?
  phone       String?
  address     String?
  taxId       String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Inquiry
Main business entity representing customer inquiries.

```prisma
model Inquiry {
  id               String        @id @default(cuid())
  sequentialNumber Int           @unique
  title            String
  description      String?
  status           InquiryStatus @default(DRAFT)
  priority         Priority      @default(MEDIUM)
  deadline         DateTime?
  totalValue       Decimal?      @db.Decimal(12, 2)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  
  // Relations
  customerId       String
  createdById      String
  assignedToId     String?
}
```

**Key Features:**
- `sequentialNumber`: Unique auto-incrementing number for easy reference
- Status workflow: DRAFT → SUBMITTED → IN_REVIEW → ASSIGNED → IN_PROGRESS → COMPLETED
- Priority levels: LOW, MEDIUM, HIGH, URGENT

### InquiryItem
Individual items/products within an inquiry.

```prisma
model InquiryItem {
  id                String     @id @default(cuid())
  name              String
  description       String?
  quantity          Int        @default(1)
  unit              String?
  status            ItemStatus @default(PENDING)
  notes             String?
  requestedDelivery DateTime?
  priceEstimation   Decimal?   @db.Decimal(12, 2)
  
  // Relations
  inquiryId         String
  assignedToId      String?
}
```

**Status Flow:**
- PENDING → ASSIGNED → IN_PROGRESS → CALCULATED → APPROVED → REJECTED

### CostCalculation
Cost breakdown for inquiry items.

```prisma
model CostCalculation {
  id              String   @id @default(cuid())
  calculatedById  String
  itemId          String   @unique
  
  // Cost Breakdown
  materialCost    Decimal  @db.Decimal(12, 2)
  laborCost       Decimal  @db.Decimal(12, 2)
  overheadCost    Decimal  @db.Decimal(12, 2)
  profitMargin    Decimal  @db.Decimal(5, 2)
  totalCost       Decimal  @db.Decimal(12, 2)
  
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Database Indexes

### Performance Optimizations
1. **Inquiry.sequentialNumber**: Indexed (DESC) for fast max value lookup
2. **Inquiry.createdAt**: Indexed (DESC) for recent inquiries queries
3. **User.email**: Unique index for authentication
4. **Foreign Keys**: All automatically indexed by PostgreSQL

## Migration Notes

### Adding Sequential Numbers to Existing Data
When adding `sequentialNumber` to existing inquiries:

```sql
-- Add column with default
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS "sequentialNumber" INTEGER NOT NULL DEFAULT 0;

-- Populate with sequential values based on creation date
WITH numbered_inquiries AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) as rn
  FROM inquiries
)
UPDATE inquiries 
SET "sequentialNumber" = numbered_inquiries.rn
FROM numbered_inquiries
WHERE inquiries.id = numbered_inquiries.id;

-- Add unique constraint
ALTER TABLE inquiries 
ADD CONSTRAINT "inquiries_sequentialNumber_key" UNIQUE ("sequentialNumber");

-- Remove default
ALTER TABLE inquiries 
ALTER COLUMN "sequentialNumber" DROP DEFAULT;
```

## Best Practices

### Sequential Number Generation
Always use a transaction when generating new sequential numbers:

```typescript
const nextNumber = await db.$transaction(async (tx) => {
  const latest = await tx.inquiry.findFirst({
    orderBy: { sequentialNumber: 'desc' },
    select: { sequentialNumber: true }
  });
  
  return (latest?.sequentialNumber || 0) + 1;
});
```

### Decimal Fields
- All monetary values use `Decimal` type with precision (12,2)
- This supports values up to 9,999,999,999.99
- Always use Prisma's Decimal type in TypeScript

### Soft Deletes
- Use `isActive` flags instead of hard deletes for Users and Customers
- Maintain referential integrity and audit trail

## Future Considerations

1. **Partitioning**: Consider partitioning large tables (inquiries, audit_logs) by date
2. **Archiving**: Implement archiving strategy for old inquiries
3. **Read Replicas**: Use Supabase read replicas for reporting queries
4. **Materialized Views**: Consider for complex reporting needs