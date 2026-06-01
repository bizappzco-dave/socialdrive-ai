#!/usr/bin/env bash
set -euo pipefail

FRONTEND_URL="${FRONTEND_URL:-https://socialdrive-ai.vercel.app}"
MCP_URL="${MCP_URL:-https://social-drive-mcp-railway-production-cb81.up.railway.app}"
OLLAMA_URL="${OLLAMA_URL:-https://ollama-production-6ab6.up.railway.app}"

pass() { echo "[PASS] $1"; }
fail() { echo "[FAIL] $1"; exit 1; }
info() { echo "[INFO] $1"; }

check_http_200() {
  local name="$1"
  local url="$2"
  local code
  code=$(curl -s -o /tmp/sd_check.out -w "%{http_code}" "$url" || true)
  if [[ "$code" == "200" ]]; then
    pass "$name ($url) -> 200"
  else
    echo "Response body:"
    cat /tmp/sd_check.out || true
    fail "$name ($url) -> $code"
  fi
}

info "Running SocialDrive production sanity checks..."

check_http_200 "Frontend" "$FRONTEND_URL"
check_http_200 "MCP health" "$MCP_URL/health"
check_http_200 "Ollama tags" "$OLLAMA_URL/api/tags"
check_http_200 "Agency submissions API" "$FRONTEND_URL/api/agency/submissions"

# Validate MCP health JSON has healthy status
mcp_status=$(curl -s "$MCP_URL/health" | jq -r '.status // empty')
[[ "$mcp_status" == "healthy" ]] && pass "MCP status is healthy" || fail "MCP status is '$mcp_status'"

# Validate Ollama has model list
model_count=$(curl -s "$OLLAMA_URL/api/tags" | jq '.models | length')
[[ "$model_count" =~ ^[0-9]+$ ]] && [[ "$model_count" -gt 0 ]] && pass "Ollama model list available ($model_count models)" || fail "Ollama model list missing"

# Validate submissions payload shape
submission_count=$(curl -s "$FRONTEND_URL/api/agency/submissions" | jq 'length')
[[ "$submission_count" =~ ^[0-9]+$ ]] && pass "Submissions API returns array ($submission_count rows)" || fail "Submissions API malformed"

# Validate first row has expected keys (if any rows)
if [[ "$submission_count" -gt 0 ]]; then
  has_id=$(curl -s "$FRONTEND_URL/api/agency/submissions" | jq '.[0] | has("id")')
  has_status=$(curl -s "$FRONTEND_URL/api/agency/submissions" | jq '.[0] | has("status")')
  has_post_count=$(curl -s "$FRONTEND_URL/api/agency/submissions" | jq '.[0] | has("post_count")')
  [[ "$has_id" == "true" && "$has_status" == "true" && "$has_post_count" == "true" ]] && pass "Submissions row includes id/status/post_count" || fail "Submissions row missing expected keys"
fi

info "All production sanity checks passed."
