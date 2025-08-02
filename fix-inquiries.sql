-- First, let's check if there are any inquiries without sequentialNumber
SELECT COUNT(*) as count_without_sequential FROM "Inquiry" WHERE "sequentialNumber" IS NULL;

-- Update existing inquiries with sequential numbers
UPDATE "Inquiry"
SET "sequentialNumber" = subquery.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) as rn
  FROM "Inquiry"
) as subquery
WHERE "Inquiry".id = subquery.id
  AND "Inquiry"."sequentialNumber" IS NULL;