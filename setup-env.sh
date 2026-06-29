#!/bin/bash
# Setup script dengan token yang sudah diberikan
# Jalankan: source setup-env.sh

echo "======================================"
echo "Setting up VFlow Environment Variables"
echo "======================================"
echo ""

# VFlow Configuration
export VFLOW_BASE_URL="https://sqavflow.vastar.id"
export VFLOW_TENANT="_default"
export VFLOW_ADMIN_KEY="18539d565293b6476759a5e04cceeb5275971b136aa73a5bddfc10a4fb35d949"
export LOGSTREAM_TOKEN="S8gZXQCDS9TWkol3ARO4Mw7TPtesGnAHIJlONCVcOVc="
export VFLOW_PACK_SECRET_KEY_B64="eoL945DRr40vXsjYrIhtP4C1xcxwGacZC1R6RspZN/Y="

# Database Configuration (PostgreSQL lokal)
export DATABASE_URL="postgresql://postgres:postgres123@127.0.0.1:5432/kelompok1_internship"
export KELOMPOK1_DATABASE_URL="postgresql://postgres:postgres123@db-tunnel.vastar.id:15431/kelompok1_internship"
export KELOMPOK1_DATABASE_NAME="kelompok1_internship"
export KELOMPOK1_DATABASE_USER="postgres"
export KELOMPOK1_DATABASE_PASSWORD="postgres123"

echo "✓ VFlow environment variables set"
echo ""
echo "Variables configured:"
echo "  VFLOW_BASE_URL: $VFLOW_BASE_URL"
echo "  VFLOW_ADMIN_KEY: [REDACTED]"
echo "  LOGSTREAM_TOKEN: [REDACTED]"
echo "  VFLOW_PACK_SECRET_KEY_B64: [REDACTED]"
echo "  DATABASE_URL: $DATABASE_URL"
echo "  KELOMPOK1_DATABASE_URL: $KELOMPOK1_DATABASE_URL"
echo ""
echo "Next steps:"
echo "1. Setup PostgreSQL: createdb -U postgres kelompok1_internship"
echo "2. Run migration: cd backend && node scripts/migrate-to-postgresql.js"
echo "3. Provision workflow: bash workflow/scripts/provision-vflow.sh"
echo "4. Test: bash workflow/scripts/smoke-vflow.sh"
echo ""
echo "⚠️  WARNING: These tokens are now in your shell session."
echo "   Do NOT commit these to git!"