#!/usr/bin/env bash
# SocialDrive AI - Production Sanity Check
# Run after every deployment to verify upload flow is working

set -e

echo "════════════════════════════════════════════════════════"
echo "  SocialDrive AI - Production Sanity Check"
echo "════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Test function
test_step() {
    local name="$1"
    local cmd="$2"
    
    echo -n "Testing: $name... "
    
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((FAILED++))
        return 1
    fi
}

# Test function with output
test_step_output() {
    local name="$1"
    local cmd="$2"
    
    echo -n "Testing: $name... "
    
    local output
    if output=$(eval "$cmd" 2>&1); then
        echo -e "${GREEN}✅ PASSED${NC}"
        echo "$output" | head -3
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "$output" | head -3
        ((FAILED++))
        return 1
    fi
}

echo "1. MCP Server Health Check"
echo "────────────────────────────────────────────────────────"
test_step_output \
    "MCP Server Health" \
    "curl -s https://social-drive-mcp-railway-production-cb81.up.railway.app/health | jq '.'"

echo ""
echo "2. MCP Caption Generation Test"
echo "────────────────────────────────────────────────────────"
test_step_output \
    "MCP Caption Generation (barber industry)" \
    "timeout 15 curl -s -X POST https://social-drive-mcp-railway-production-cb81.up.railway.app/generate-captions \
        -H 'Content-Type: application/json' \
        -d '{\"image_base64\": \"data:image/jpeg;base64,/9j/4AAQSkZJRg...\", \"template_match\": {\"scene_type\": \"barber\"}, \"industry\": \"barber\", \"count\": 1}' \
        | jq '.success, .captions[0].hashtags'"

echo ""
echo "3. Vercel Frontend Check"
echo "────────────────────────────────────────────────────────"
test_step \
    "Vercel Upload Page" \
    "curl -s -o /dev/null -w '%{http_code}' https://socialdrive-ai.vercel.app/upload/53a6916397d6613af02afdfa000157fd | grep -q '200'"

echo ""
echo "4. Database Connection Check"
echo "────────────────────────────────────────────────────────"
# This would need Supabase credentials - skip for now
echo -e "${YELLOW}⊘ Skipped (requires Supabase credentials)${NC}"

echo ""
echo "5. Recent Submissions Check"
echo "────────────────────────────────────────────────────────"
test_step_output \
    "Recent Submissions API" \
    "curl -s https://socialdrive-ai.vercel.app/api/agency/submissions | jq 'length'"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Results: ${GREEN}${PASSED} passed${NC}, ${RED}${FAILED} failed${NC}"
echo "════════════════════════════════════════════════════════"

if [ $FAILED -gt 0 ]; then
    echo ""
    echo -e "${RED}⚠️  SOME TESTS FAILED - Check deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Check Vercel Function Logs: https://vercel.com/bizappzco-dave/socialdrive-ai/activity"
    echo "2. Check Railway Logs: railway logs --deployment {id}"
    echo "3. Test upload flow manually: https://socialdrive-ai.vercel.app/upload/53a6916397d6613af02afdfa000157fd"
    exit 1
else
    echo ""
    echo -e "${GREEN}✅ ALL TESTS PASSED - Upload flow is healthy!${NC}"
    echo ""
    echo "Manual test recommended:"
    echo "1. Open: https://socialdrive-ai.vercel.app/upload/53a6916397d6613af02afdfa000157fd"
    echo "2. Upload 3 images, add brief, click 'Process My Posts'"
    echo "3. Check F12 console for: [MCP] ✅ Generated 3 captions"
    echo "4. Verify posts have barber hashtags (not generic)"
    exit 0
fi
