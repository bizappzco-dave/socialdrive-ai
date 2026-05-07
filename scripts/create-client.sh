#!/bin/bash
# Create a new SocialDrive client from the command line
# Usage: ./create-client.sh "Client Name" "Industry" [tier]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SocialDrive Client Account Creator   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo

# Check arguments
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage:${NC} $0 \"Client Name\" \"Industry\" [tier]"
    echo
    echo "Examples:"
    echo "  $0 \"LED Lights Dublin\" \"Retail\" simple"
    echo "  $0 \"No Label Barber\" \"Barber Salon\" pro"
    echo "  $0 \"Test Client\" \"Other\" agency"
    echo
    echo "Tiers: simple (€29), pro (€79), agency (€149)"
    echo "Default tier: simple"
    exit 1
fi

CLIENT_NAME="$1"
INDUSTRY="${2:-Barber Salon}"
TIER="${3:-simple}"

echo -e "${GREEN}Creating client:${NC}"
echo "  Name: $CLIENT_NAME"
echo "  Industry: $INDUSTRY"
echo "  Tier: $TIER"
echo

# Get Supabase credentials from environment or .env
if [ -f ".env.local" ]; then
    source .env.local
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${YELLOW}Warning: NEXT_PUBLIC_SUPABASE_URL not set${NC}"
    echo "Please set it or create a .env.local file"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}Warning: SUPABASE_SERVICE_ROLE_KEY not set${NC}"
    echo "Please set it or create a .env.local file"
    exit 1
fi

# Create client via Supabase API
echo -e "${GREEN}Creating client in database...${NC}"

CLIENT_RESPONSE=$(curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/clients" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"6edb897e-6882-4698-925c-2f9693787242\",
    \"name\": \"$CLIENT_NAME\",
    \"industry\": \"$INDUSTRY\",
    \"tier\": \"$TIER\",
    \"is_active\": true
  }")

# Extract client ID
CLIENT_ID=$(echo "$CLIENT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CLIENT_ID" ]; then
    echo -e "${YELLOW}Error creating client${NC}"
    echo "Response: $CLIENT_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Client created with ID: $CLIENT_ID${NC}"
echo

# Generate tokens (simple random hex)
UPLOAD_TOKEN=$(openssl rand -hex 16)
REVIEW_TOKEN=$(openssl rand -hex 16)

echo -e "${GREEN}Creating submission record...${NC}"

# Create submission
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/submissions" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"client_id\": \"$CLIENT_ID\",
    \"upload_token\": \"$UPLOAD_TOKEN\",
    \"review_token\": \"$REVIEW_TOKEN\",
    \"client_name\": \"$CLIENT_NAME\",
    \"status\": \"pending\"
  }" > /dev/null

echo -e "${GREEN}✓ Submission record created${NC}"
echo

# Generate URLs
BASE_URL="https://socialdrive-ai.vercel.app"
UPLOAD_URL="$BASE_URL/upload/$UPLOAD_TOKEN"
REVIEW_URL="$BASE_URL/review/$REVIEW_TOKEN"

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Client Created Successfully!            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${GREEN}Client Details:${NC}"
echo "  ID: $CLIENT_ID"
echo "  Name: $CLIENT_NAME"
echo "  Industry: $INDUSTRY"
echo "  Tier: $TIER"
echo
echo -e "${GREEN}Upload Link:${NC} $UPLOAD_URL"
echo -e "${GREEN}Review Link:${NC} $REVIEW_URL"
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Send upload link to client"
echo "  2. Client uploads photos + brief"
echo "  3. Review generated posts at review link"
echo "  4. Approve and export to Sociamonials"
echo
echo -e "${BLUE}Tip: Save these links in a note or bookmark them${NC}"
