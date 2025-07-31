# Metal Industry Test Data Seeder

This script creates test data for the assignment system with metal industry inquiries and items.

## What it creates:

1. **Customer**: SteelTech Industries (metal fabrication company)

2. **5 Inquiries** with different priorities:
   - Steel Beam Fabrication Project (HIGH priority)
   - Stainless Steel Kitchen Equipment (MEDIUM priority)
   - Aluminum Extrusion Profiles Order (URGENT priority)
   - Copper Components Manufacturing (HIGH priority)
   - Tool Steel and Machinery Parts (MEDIUM priority)

3. **25 Items Total** (5 items per inquiry):
   - All items are in PENDING status (unassigned)
   - Items include various metal products and services
   - Real-world metal industry items with proper units

4. **Users Created** (if they don't exist):
   - SALES user: sales@metalworks.com
   - VP users: vp1@metalworks.com, vp2@metalworks.com
   - VPP user: vpp@metalworks.com
   - All with password: password123

## How to run:

1. **Ensure your dev server is NOT running** (to avoid connection conflicts)

2. **Run the seed script**:
   ```bash
   npm run db:seed:metal
   ```

3. **Start your dev server**:
   ```bash
   npm run dev
   ```

4. **Login as VPP user**:
   - Email: vpp@metalworks.com
   - Password: password123

5. **Navigate to assignments**:
   - Go to: http://localhost:3000/dashboard/assignments/dnd
   - You should see 25 unassigned items ready for drag-and-drop assignment

## Test the assignment system:

1. **Individual item assignment**: Drag single items to VP users
2. **Group assignment**: Drag entire inquiry groups to assign all 5 items at once
3. **User reordering**: Drag users to reorder them
4. **Filters**: Test customer, inquiry, and priority filters
5. **Search**: Search for specific items like "steel", "aluminum", etc.

## Reset data:

To clear all data and start fresh:
```bash
npm run db:reset
```

Then run the seed script again.

## Notes:

- All inquiries have SUBMITTED status (makes items assignable)
- All items have PENDING status (unassigned)
- Deadlines are set 30 days from creation
- Requested delivery dates are 45 days from creation
- Items include realistic metal industry products with proper units (kg, m², meters, pieces, hours)