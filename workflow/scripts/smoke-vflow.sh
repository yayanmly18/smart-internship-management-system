#!/bin/bash
set -euo pipefail

# Smoke test script for Kelompok 1 VFlow workflows
# Usage: ./smoke-vflow.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "Kelompok 1 VFlow Smoke Test"
echo "======================================"
echo ""

# Check required environment variables
if [[ -z "${VFLOW_BASE_URL:-}" ]]; then
  echo -e "${RED}Error: VFLOW_BASE_URL is not set${NC}"
  echo "Example: export VFLOW_BASE_URL=\"https://sqavflow.vastar.id\""
  exit 1
fi

echo -e "${GREEN}✓${NC} VFLOW_BASE_URL: $VFLOW_BASE_URL"
echo ""

# Test webhook endpoint
WEBHOOK_PATH="/webhook/kelompok1/internship/register-test"
WEBHOOK_URL="${VFLOW_BASE_URL}${WEBHOOK_PATH}"

echo "======================================"
echo "Testing webhook endpoint"
echo "======================================"
echo ""
echo "URL: $WEBHOOK_URL"
echo "Method: POST"
echo ""

# Test payload
TEST_PAYLOAD='{
  "name": "Test User",
  "nim": "22031234",
  "email": "test@example.com"
}'

echo "Payload:"
echo "$TEST_PAYLOAD" | jq .
echo ""

# Send POST request
echo "Sending request..."
RESPONSE=$(curl -sS -X POST \
  "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD" 2>&1) || true

CURL_EXIT_CODE=$?

if [[ $CURL_EXIT_CODE -ne 0 ]]; then
  echo -e "${RED}✗${NC} curl failed with exit code: $CURL_EXIT_CODE"
  echo "Response: $RESPONSE"
  exit 1
fi

echo ""
echo "======================================"
echo "Response received"
echo "======================================"
echo ""

# Check if response is valid JSON
if echo "$RESPONSE" | jq empty 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Response is valid JSON"
  echo ""
  echo "Response body:"
  echo "$RESPONSE" | jq .
  echo ""
  
  # Validate expected fields
  STATUS=$(echo "$RESPONSE" | jq -r '.status // empty')
  SOURCE=$(echo "$RESPONSE" | jq -r '.source // empty')
  NAME=$(echo "$RESPONSE" | jq -r '.name // empty')
  NIM=$(echo "$RESPONSE" | jq -r '.nim // empty')
  EMAIL=$(echo "$RESPONSE" | jq -r '.email // empty')
  
  echo "Validating response fields..."
  
  if [[ "$STATUS" == "received" ]]; then
    echo -e "${GREEN}✓${NC} status = 'received'"
  else
    echo -e "${YELLOW}⚠${NC} status = '$STATUS' (expected 'received')"
  fi
  
  if [[ "$SOURCE" == "vflow" ]]; then
    echo -e "${GREEN}✓${NC} source = 'vflow'"
  else
    echo -e "${YELLOW}⚠${NC} source = '$SOURCE' (expected 'vflow')"
  fi
  
  if [[ "$NAME" == "Test User" ]]; then
    echo -e "${GREEN}✓${NC} name = 'Test User'"
  else
    echo -e "${YELLOW}⚠${NC} name = '$NAME' (expected 'Test User')"
  fi
  
  if [[ "$NIM" == "22031234" ]]; then
    echo -e "${GREEN}✓${NC} nim = '22031234'"
  else
    echo -e "${YELLOW}⚠${NC} nim = '$NIM' (expected '22031234')"
  fi
  
  if [[ "$EMAIL" == "test@example.com" ]]; then
    echo -e "${GREEN}✓${NC} email = 'test@example.com'"
  else
    echo -e "${YELLOW}⚠${NC} email = '$EMAIL' (expected 'test@example.com')"
  fi
  
  echo ""
  echo -e "${GREEN}======================================"
  echo "✓ Smoke test PASSED"
  echo "======================================${NC}"
  echo ""
  echo "The VFlow webhook is working correctly!"
  echo ""
  echo "Next steps:"
  echo "1. Check logs with LogStream (requires LOGSTREAM_TOKEN)"
  echo "2. Verify route in health endpoint"
  echo "3. Proceed with business workflow integration"
  
else
  echo -e "${RED}✗${NC} Response is not valid JSON"
  echo ""
  echo "Raw response:"
  echo "$RESPONSE"
  echo ""
  
  # Check for common errors
  if echo "$RESPONSE" | grep -q "no workflow for path"; then
    echo -e "${RED}Error: Workflow not found for path${NC}"
    echo "The workflow may not be provisioned yet."
    echo "Run: ./provision-vflow.sh"
  elif echo "$RESPONSE" | grep -q "unauthorized"; then
    echo -e "${RED}Error: Unauthorized${NC}"
    echo "Check your VFLOW_ADMIN_KEY or authentication."
  else
    echo -e "${RED}Error: Unknown error${NC}"
  fi
  
  exit 1
fi