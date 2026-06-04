#!/usr/bin/env bash
# Clean up all test submissions and posts for No Label Academy

set -e

echo "════════════════════════════════════════════════════════"
echo "  SocialDrive - Clean Up Test Data"
echo "════════════════════════════════════════════════════════"
echo ""

# No Label Academy client ID
CLIENT_ID="4ffd9ffd-0da5-411d-8725-998f10107440"

echo "⚠️  This will DELETE all submissions and posts for:"
echo "   Client ID: $CLIENT_ID"
echo "   Client Name: No Label Academy"
echo ""
echo "This action CANNOT be undone!"
echo ""
read -p "Type 'yes' to confirm: " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Cancelled"
  exit 1
fi

echo ""
echo "Getting Supabase credentials..."

# Get credentials
if [ -z "$SUPABASE_URL" ]; then
  SUPABASE_URL="https://nmebpawvnhrokouksvir.supabase.co"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Please enter your Supabase Service Role Key:"
  read -s SUPABASE_SERVICE_ROLE_KEY
  echo ""
fi

echo ""
echo "Deleting posts..."

# Delete all posts for this client
curl -s -X DELETE "$SUPABASE_URL/rest/v1/posts?client_id=eq.$CLIENT_ID" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Prefer: return=minimal"

echo "✅ Posts deleted"

echo ""
echo "Deleting submissions..."

# Delete all submissions for this client
curl -s -X DELETE "$SUPABASE_URL/rest/v1/submissions?client_id=eq.$CLIENT_ID" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Prefer: return=minimal"

echo "✅ Submissions deleted"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✅ Clean up complete!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Run migration: database/migrations/add-schedule-preferences.sql"
echo "2. Test fresh upload: https://socialdrive-ai.vercel.app/upload/53a6916397d6613af02afdfa000157fd"
echo "3. Review posts: /review/{token}"
echo "4. Check dashboard: /client/posting"
echo ""
