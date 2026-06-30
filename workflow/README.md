# VFlow Workflow Documentation - Kelompok 1

Dokumentasi lengkap untuk workflow VFlow Kelompok 1.

## 📁 Struktur Direktori

```
workflow/
├── vflow/                      # VFlow Workflow Definitions (VWFD)
│   ├── 01-register-test.yaml   # Workflow test untuk verifikasi
│   └── pack.yaml               # Connection pack configuration
│
├── vrules/                     # VRule Definitions
│   ├── vrule_document_validation.yaml
│   ├── vrule_eligibility_check.yaml
│   ├── vrule_admin_verification.yaml
│   ├── vrule_supervisor_approval.yaml
│   ├── vrule_company_matching.yaml
│   ├── vrule_performance_grading.yaml
│   ├── vrule_certificate_release.yaml
│   ├── vrule_progress_compliance.yaml
│   └── vrule_approval_requirement.yaml
│
├── starlark/                   # Starlark Scripts
│   ├── document_validation.star
│   ├── eligibility.star
│   ├── admin_verification.star
│   ├── supervisor_approval.star
│   ├── company_matching.star
│   ├── performance_grading.star
│   └── certificate.star
│
├── scripts/                    # Utility Scripts
│   ├── provision-vflow.sh      # Provision workflow ke VFlow
│   └── smoke-vflow.sh          # Smoke test untuk verifikasi
│
├── workflow.yaml               # Conceptual workflow design (legacy)
├── SETUP.md                    # Panduan setup lengkap
└── README.md                   # This file
```

## 🎯 Workflow yang Sudah Ada

### 1. Test Workflow (Siap Pakai)

**File**: `vflow/01-register-test.yaml`

**Path**: `/webhook/kelompok1/internship/register-test`

**Fungsi**: Workflow test sederhana untuk verifikasi VFlow integration

**Cara Pakai**:
```bash
# Provision
bash workflow/scripts/provision-vflow.sh

# Test
bash workflow/scripts/smoke-vflow.sh
```

**Expected Response**:
```json
{
  "status": "received",
  "source": "vflow",
  "name": "Test User",
  "nim": "22031234",
  "email": "test@example.com"
}
```

### 2. Business Workflow (Conceptual)

**File**: `workflow.yaml`

**Fungsi**: Desain workflow bisnis lengkap (belum dalam format VWFD)

**Workflow yang ada**:
1. Registration
2. Eligibility Check
3. Admin Verification
4. Document Revision
5. Supervisor Approval
6. Company Placement
7. Weekly Monitoring
8. Performance Evaluation
9. Certification

**Catatan**: File ini masih dalam format konseptual. Untuk menjalankan di VFlow, perlu ditulis ulang ke format VWFD.

## 🔧 Komponen Workflow

### Activities

Activities adalah unit kerja dasar dalam VFlow:

| Activity Type | Fungsi | Contoh |
|--------------|--------|--------|
| `Trigger` | Memulai workflow dari webhook | POST request ke `/webhook/...` |
| `Transform` | Transformasi data | Mapping, formatting |
| `EndTrigger` | Mengembalikan response | Final response ke caller |
| `End` | Mengakhiri workflow | - |
| `DBQuery` | Query database | SELECT, INSERT, UPDATE |
| `HTTPCall` | Call external API | REST API call |
| `Starlark` | Jalankan Starlark script | Eligibility scoring |

### Flows

Flows menghubungkan activities:

```yaml
flows:
  - { id: f01, from: { node: trigger }, to: { node: process } }
  - { id: f02, from: { node: process }, to: { node: respond } }
```

### Variables

Variables menyimpan data selama workflow execution:

```yaml
variables:
  - { name: trigger_payload, type: object }
  - { name: final_response, type: object }
```

## 📝 Format VWFD (VFlow Workflow Definition)

Setiap workflow VFlow harus mengikuti format VWFD:

```yaml
version: "3.0"
metadata:
  id: kelompok1-<unique-id>        # Harus unik dan prefix kelompok1
  name: "Kelompok 1 - <Nama>"
  dialect: vflow
  tags: [kelompok1, ...]

spec:
  activities:
    - id: <activity-id>
      activity_type: <type>
      # ... config
  
  flows:
    - { id: f01, from: { node: <from> }, to: { node: <to> } }
  
  variables:
    - { name: <name>, type: <type> }
```

## 🚀 Provision Workflow

### Provision Test Workflow

```bash
# Method 1: Using script
bash workflow/scripts/provision-vflow.sh

# Method 2: Manual
./scripts/vflow-admin.sh workflows provision \
  ./workflow/vflow/01-register-test.yaml
```

### Verifikasi Provision

```bash
# Check health
curl -sS "$VFLOW_BASE_URL/api/admin/health" \
  -H "Authorization: Bearer $VFLOW_ADMIN_KEY" | jq .

# Check routes
curl -sS "$VFLOW_BASE_URL/api/admin/health" \
  -H "Authorization: Bearer $VFLOW_ADMIN_KEY" \
  | jq -r '.webhook_routes[]?[0]' \
  | grep 'kelompok1'
```

## 🧪 Testing

### Smoke Test

```bash
bash workflow/scripts/smoke-vflow.sh
```

### Manual Test

```bash
curl -sS -X POST \
  "$VFLOW_BASE_URL/webhook/kelompok1/internship/register-test" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Budi Santoso",
    "nim": "22031234",
    "email": "budi@example.com"
  }' | jq .
```

### LogStream

```bash
curl -N \
  -H "Authorization: Bearer $LOGSTREAM_TOKEN" \
  "$VFLOW_BASE_URL/logs/vflow-server?tail=100&follow=true&timestamps=true"
```

## 🔌 Connection Pack

Connection pack mendefinisikan koneksi database dan services:

**File**: `vflow/pack.yaml`

**ID**: `kelompok1-internship`

**Connector**: `pack://kelompok1-internship/primary`

**Type**: PostgreSQL via tunnel

**Host**: `db-tunnel.vastar.id:15431`

### Install Pack

```bash
export VFLOW_PACK_SECRET_KEY_B64="<key>"
./scripts/vflow-admin.sh packs install ./workflow/vflow/pack.yaml
```

### Verify Pack

```bash
./scripts/vflow-admin.sh packs list | grep kelompok1
```

## 🗄️ Database Integration

### PostgreSQL Schema

Workflow VFlow mengakses PostgreSQL melalui connection pack:

```yaml
# Contoh activity dengan DB query
- id: fetch_user
  activity_type: DBQuery
  db_query:
    connector_ref: "pack://kelompok1-internship/primary"
    query: |
      SELECT * FROM users 
      WHERE email = $1
    params:
      - source: trigger_payload.email
  output_variable: user_data
```

### Important Notes

- **Jangan pakai `localhost`** di connection pack
- **Gunakan `db-tunnel.vastar.id:15431`**
- Backend lokal boleh pakai `127.0.0.1:5432`
- VFlow runtime menggunakan tunnel host

## 📚 Referensi

### Dokumentasi

- **Setup Lengkap**: `SETUP.md`
- **Cheat Sheet**: `docs/VFLOW_CHEATSHEET.md`
- **Quick Start**: `QUICKSTART.md`
- **Main README**: `README.md`

### Toolkit Referensi

- `/home/abraham/magang/aws-test-vflow/vflow-authoring-guide/06-pack-tier.md`
- `/home/abraham/magang/aws-test-vflow/provision-pattern/066-hot-connection-pack-provision`

## 🎓 Best Practices

### 1. Naming Convention

- **Workflow ID**: `kelompok1-<deskripsi>` (e.g., `kelompok1-internship-register`)
- **Webhook Path**: `/webhook/kelompok1/<deskripsi>` (e.g., `/webhook/kelompok1/internship/register`)
- **Pack ID**: `kelompok1-<kategori>` (e.g., `kelompok1-internship`)
- **Tags**: Always include `kelompok1`

### 2. Testing

- Test dengan smoke test sebelum deploy
- Gunakan LogStream untuk debugging
- Verifikasi route di health endpoint
- Jangan langsung buat workflow kompleks

### 3. Security

- Jangan commit token/kredensial
- Gunakan environment variables
- Validasi semua input
- Gunakan HTTPS di production

### 4. Error Handling

- Implement retry policy di connection pack
- Handle validation errors di workflow
- Log semua error untuk debugging
- Gunakan EndTrigger untuk error response

## 🐛 Troubleshooting

### Workflow tidak muncul di health

```bash
# Cek apakah provision berhasil
./scripts/vflow-admin.sh workflows list | grep kelompok1

# Provision ulang jika perlu
bash workflow/scripts/provision-vflow.sh
```

### Webhook return "no workflow for path"

1. Cek `webhook_config.path` di YAML
2. Provision ulang workflow
3. Cek route di health endpoint
4. Pastikan path sama persis

### Database connection failed

1. Cek rathole client berjalan
2. Cek DSN menggunakan `db-tunnel.vastar.id:15431`
3. Cek PostgreSQL schema sudah dibuat
4. Test koneksi: `psql $KELOMPOK1_DATABASE_URL`

### Response tidak sesuai

1. Cek `end_activity` di trigger config
2. Cek `trigger_ref` di EndTrigger
3. Cek `output_variable` dan `final_response`

## 📞 Support

Jika memerlukan bantuan:
1. Baca `SETUP.md` untuk panduan lengkap
2. Cek LogStream untuk error details
3. Hubungi pembimbing untuk token/kredensial

---

**Kelompok 1** - Smart Internship Management System