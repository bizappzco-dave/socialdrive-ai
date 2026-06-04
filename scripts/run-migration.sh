#!/usr/bin/env bash
# Run schedule preferences migration on Supabase

set -e

echo "════════════════════════════════════════════════════════"
echo "  SocialDrive - Schedule Preferences Migration"
echo "════════════════════════════════════════════════════════"
echo ""

# Get credentials from environment or prompt
if [ -z "$SUPABASE_URL" ]; then
  SUPABASE_URL="https://nmebpawvnhrokouksvir.supabase.co"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "⚠️  SUPABASE_SERVICE_ROLE_KEY not set"
  echo "Please enter your Supabase Service Role Key:"
  read -s SUPABASE_SERVICE_ROLE_KEY
  echo ""
fi

echo "Running migration on: $SUPABASE_URL"
echo ""

# Run migration
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS default_schedule_type TEXT DEFAULT '\''mwf'\'' CHECK (default_schedule_type IN ('\''mwf'\'', '\''daily'\''));
      
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS default_posting_time TIME DEFAULT '\''10:00:00'\'';
      
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS schedule_randomization INTEGER DEFAULT 30 CHECK (schedule_randomization >= 0 AND schedule_randomization <= 120);
      
      UPDATE clients SET 
        default_schedule_type = COALESCE(default_schedule_type, '\''mwf'\''),
        default_posting_time = COALESCE(default_posting_time, '\''10:00:00'\''),
        schedule_randomization = COALESCE(schedule_randomization, 30)
      WHERE id IS NOT NULL;
    "
  }' | jq '.'

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Test review page: https://socialdrive-ai.vercel.app/review/95fe60faf8f240cd890a610a1e383c9b"
echo "2. Check client preferences loaded"
echo "3. Verify random scheduling works"
