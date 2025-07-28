# Business Partners Management

This document describes the Business Partners feature that was added to the GS-CMS system.

## Overview

The Business Partners management system allows the organization to maintain a database of all business partners and suppliers. This feature was implemented based on the business partners list imported from a CSV file.

## Database Schema

### BusinessPartner Model

```prisma
model BusinessPartner {
  id        String   @id @default(cuid())
  name      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("business_partners")
}
```

### Fields Description

- **id**: Unique identifier (CUID)
- **name**: Business partner name (unique, required)
- **isActive**: Status flag for soft delete functionality
- **createdAt**: Record creation timestamp
- **updatedAt**: Last update timestamp

## API Endpoints

### GET /api/business-partners

Retrieve all business partners with optional filtering and pagination.

**Query Parameters:**
- `search` (optional): Filter by name (case-insensitive)
- `isActive` (optional): Filter by status (`true`, `false`, `all`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "data": [
    {
      "id": "cmdj4yrs40000i019wecsxtps",
      "name": "BOBST",
      "isActive": true,
      "createdAt": "2025-07-25T18:09:38.597Z",
      "updatedAt": "2025-07-25T18:09:38.597Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 66,
    "pages": 2
  }
}
```

### POST /api/business-partners

Create a new business partner.

**Request Body:**
```json
{
  "name": "New Partner Name",
  "isActive": true
}
```

### GET /api/business-partners/[id]

Retrieve a specific business partner by ID.

### PATCH /api/business-partners/[id]

Update an existing business partner.

**Request Body:**
```json
{
  "name": "Updated Name",
  "isActive": false
}
```

### DELETE /api/business-partners/[id]

Soft delete a business partner (sets `isActive` to false).

## Data Import

### Initial Import

The system was populated with 66 business partners from the CSV file `/home/hrvanovic_5510/Documents/bussines_partners.csv`.

### Import Script

Use the following command to import business partners:

```bash
npm run import:business-partners
```

### Verification Script

To verify the imported data:

```bash
npm run verify:business-partners
```

## Permissions

The Business Partners feature respects the existing role-based permission system:

- **Read Access**: `hasPermission(userRole, 'business_partners', 'read')`
- **Write Access**: `hasPermission(userRole, 'business_partners', 'write')`
- **Delete Access**: `hasPermission(userRole, 'business_partners', 'delete')`

## Current Data

As of 2025-07-25, the system contains 66 business partners including:

- BOBST, BOBST LYON
- AMATEK, BBM, BC
- BRUKS, CHIRON, CINCINNATI
- DMG MORI, DOKA AUSTRIA
- GROB, HAENDLE, HANDEL
- SIEMENS ENERGY, SCHULER
- And many more...

## Future Enhancements

The current implementation provides a foundation for more advanced features:

1. **Partnership Types**: Categorize partners (suppliers, distributors, etc.)
2. **Contact Information**: Add detailed contact data
3. **Contracts**: Link to contract management
4. **Performance Tracking**: Monitor partner performance
5. **Integration**: Connect with inquiry and quote systems

## Scripts Location

- Import script: `/scripts/import-business-partners.ts`
- Verification script: `/scripts/verify-business-partners.ts`
- API routes: `/src/app/api/business-partners/`

## Notes

- All business partner names are unique
- Soft delete is implemented (isActive flag)
- Full audit trail with timestamps
- Proper error handling and validation
- Consistent with existing system patterns