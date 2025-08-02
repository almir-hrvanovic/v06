-- Update existing inquiries with sequential numbers based on creation date
WITH numbered_inquiries AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) as seq_num
  FROM "Inquiry"
  WHERE "sequentialNumber" IS NULL
)
UPDATE "Inquiry"
SET "sequentialNumber" = numbered_inquiries.seq_num
FROM numbered_inquiries
WHERE "Inquiry".id = numbered_inquiries.id;

-- Verify the update
SELECT id, "sequentialNumber", "createdAt" 
FROM "Inquiry" 
ORDER BY "sequentialNumber" ASC;