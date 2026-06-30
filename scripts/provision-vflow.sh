#!/bin/bash
# Script otomatis provision Kelompok 1

export VFLOW_BASE_URL="https://sqavflow.vastar.id"
export VFLOW_TENANT="_default"
export VFLOW_ADMIN_KEY="18539d565293b6476759a5e04cceeb5275971b136aa73a5bddfc10a4fb35d949"

TOOLKIT_PATH="/c/Laptop anyar/ISAL/Kuliah/Magang/Vastar/TugasMagang/vflow-test"
PROJECT_PATH="/c/Laptop anyar/ISAL/Kuliah/Magang/Vastar/TugasMagang/smart-internship-management-system"

echo "=== 1. Menginstall Connection Pack PostgreSQL ==="
# Header disesuaikan dengan permintaan server (application/json)
curl -sS -X POST "$VFLOW_BASE_URL/api/admin/pack/install" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VFLOW_ADMIN_KEY" \
  --data-binary @"$PROJECT_PATH/workflow/vflow/pack.yaml"

echo -e "\n\n=== 2. Memulai Provision Workflow Registration ==="
cd "$TOOLKIT_PATH"
# Ditambah flag --activate biar statusnya nggak inactive lagi!
./scripts/vflow-admin.sh workflows provision "$PROJECT_PATH/workflow/vflow/02-registration.yaml" --activate

echo -e "\n=== Semua Provision Selesai! ==="