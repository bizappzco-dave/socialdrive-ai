-- Check what columns exist in brand_contexts table
-- Run this in Supabase SQL Editor

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'brand_contexts'
ORDER BY ordinal_position;
