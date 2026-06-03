#!/bin/bash
# Supabase admin queries
SERVICE_ROLE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZWJwYXd2bmhyb2tvdWtzdmlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIyNjUyOCwiZXhwIjoyMDk0ODAyNTI4fQ.sKI9qceLMdTLLSwDAGDRCHRW0muqV7B4ye8ZsGWePtg"
BASE_URL="https://nmebpawvnhrokouksvir.supabase.co/rest/v1"

echo "=== Recent Posts ==="
curl -s "$BASE_URL/posts?select=id,client_id,caption,status&limit=5" \
  -H "apikey: $SERVICE_ROLE" \
  -H "Authorization: Bearer $SERVICE_ROLE" \
  -H "Prefer: return=representation"

echo -e "\n\n=== Clients ==="
curl -s "$BASE_URL/clients?select=id,name&limit=5" \
  -H "apikey: $SERVICE_ROLE" \
  -H "Authorization: Bearer $SERVICE_ROLE"

echo -e "\n\n=== Submissions ==="
curl -s "$BASE_URL/submissions?select=id,client_id,status&limit=5" \
  -H "apikey: $SERVICE_ROLE" \
  -H "Authorization: Bearer $SERVICE_ROLE"
