#!/bin/bash
set -euo pipefail

# Provision script for Kelompok 1 VFlow workflows
# Usage: ./provision-vflow.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Kelompok 1 VFlow Provision Script"
echo "======================================"
echo ""

# Check required environment variables
if [[ -z "${VFLOW_BASE_URL:-}" ]]; then
  echo -e "${RED}Error: VFLOW_BASE_URL is not set${NC}"
  echo "Example: export VFLOW_BASE_URL=\"https://sqavflow.vastar.id\""
  exit 1
fi

if [[ -z "${VFLOW_ADMIN_KEY:-}" ]]; then
  echo -e "${RED}Error: VFLOW_ADMIN_KEY is not set${NC}"
  echo "Please request the admin key from your supervisor"
  exit 1
fi

echo -e "${GREEN}✓${NC} VFLOW_BASE_URL: $VFLOW_BASE_URL"
echo -e "${GREEN}✓${NC} VFLOW_ADMIN_KEY: [REDACTED]"
echo ""

# Check if vflow-admin.sh exists
VFLOW_ADMIN_SCRIPT="$PROJECT_ROOT/scripts/vflow-admin.sh"
if [[ ! -f "$VFLOW_ADMIN_SCRIPT" ]]; then
  echo -e "${YELLOW}Warning: vflow-admin.sh not found at $VFLOW_ADMIN_SCRIPT${NC}"
  echo "Please ensure you have the VFlow toolkit available"
  exit 1
fi

# Provision test workflow
echo "Provisioning test workflow..."
echo "Path: workflow/vflow/01-register-test.yaml"
echo ""

if "$VFLOW_ADMIN_SCRIPT" workflows provision "$PROJECT_ROOT/workflow/vflow/01-register-test.yaml"; then
  echo -e "${GREEN}✓${NC} Test workflow provisioned successfully"
else
  echo -e "${RED}✗${NC} Failed to provision test workflow"
  exit 1
fi

echo ""
echo "======================================"
echo "Verifying provisioned routes..."
echo "======================================"
echo ""

# Check health endpoint
echo "Checking VFlow health..."
HEALTH_RESPONSE=$(curl -sS "$VFLOW_BASE_URL/api/admin/health" \
  -H "Authorization: Bearer $VFLOW_ADMIN_KEY" || echo "FAILED")

if [[ "$HEALTH_RESPONSE" == "FAILED" ]]; then
  echo -e "${RED}✗${NC} Failed to connect to VFlow health endpoint"
  exit 1
fi

echo -e "${GREEN}✓${NC} VFlow is reachable"
echo ""

# Check for Kelompok 1 routes
echo "Checking Kelompok 1 routes..."
KELOMPOK1_ROUTES=$(echo "$HEALTH_RESPONSE" | jq -r '.webhook_routes[]?[0]' | grep 'kelompok1' || true)

if [[ -n "$KELOMPOK1_ROUTES" ]]; then
  echo -e "${GREEN}✓${NC} Kelompok 1 routes found:"
  echo "$KELOMPOK1_ROUTES" | while read -r route; do
    echo "  - $route"
  done
else
  echo -e "${YELLOW}⚠${NC} No Kelompok 1 routes found in health check"
  echo "This might mean the workflow was not provisioned correctly"
fi

echo ""
echo "======================================"
echo "Provision complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Run smoke test: ./smoke-vflow.sh"
echo "2. Check logs with LogStream (requires LOGSTREAM_TOKEN)"
echo ""