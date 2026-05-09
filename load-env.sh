#!/bin/bash
# Load environment variables for SocialDrive AI Python scripts

export SUPABASE_URL="https://dqhnxzaktnejasqlfrjf.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxaG54emFrdG5lamFzcWxmcmpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYzNzk0NCwiZXhwIjoyMDkzMjEzOTQ0fQ.fN3J5CIs5BMuSCYNFBvV0ZLPHGhyyeNdtdOjUA59soY"
export VIDEO_GEN_POLL_INTERVAL="30"

echo "✓ Environment variables loaded"
echo "  SUPABASE_URL: ${SUPABASE_URL:0:40}..."
echo "  SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."
