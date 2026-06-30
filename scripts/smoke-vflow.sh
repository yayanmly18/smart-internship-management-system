#!/bin/bash
# Script otomatis testing webhook Kelompok 1 - Sanity Check Data

echo "=== Menembak Webhook Kelompok 1 (Insert to DB) ==="
curl -v -N -X POST \
  "https://sqavflow.vastar.id/webhook/kelompok1/internship/register" \
  -H "Authorization: Bearer 18539d565293b6476759a5e04cceeb5275971b136aa73a5bddfc10a4fb35d949" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Isal Test",
    "nim": 12345,
    "email": "isal@vastar.id",
    "password": "passwordaman123",
    "prodi": "Teknik Informatika",
    "year": 2026,
    "phone": 81234567890
  }'
echo -e "\n=== Test Selesai ==="