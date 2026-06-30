# VFlow Integration Setup Guide - Kelompok 1

Panduan lengkap untuk mengintegrasikan VFlow ke sistem Smart Internship Management Kelompok 1.

## Daftar Isi

1. [Konsep Dasar](#konsep-dasar)
2. [Environment Variables](#environment-variables)
3. [Setup Awal](#setup-awal)
4. [Provision Workflow](#provision-workflow)
5. [Testing](#testing)
6. [Database Migration](#database-migration)
7. [Troubleshooting](#troubleshooting)

## Konsep Dasar

### Apa itu VFlow?

VFlow adalah server workflow bersama yang berjalan di `https://sqavflow.vastar.id`. VFlow menjalankan workflow yang didesain dalam format YAML (VWFD - VFlow Workflow Definition).

### Perbedaan Workflow Lokal vs VFlow

| Aspek | Workflow Lokal (Express) | Workflow VFlow |
|-------|-------------------------|----------------|
| Lokasi | `backend/services/workflow.service.js` | Server VFlow |
| Format | JavaScript | YAML (VWFD) |
| Eksekusi | Dalam proses Node.js | Runtime terpisah |
| Webhook | Tidak ada | `/webhook/kelompok1/...` |
| Database | Langsung ke SQLite/PostgreSQL | Melalui connection pack |

### Workflow VWFD Format

File workflow VFlow harus berformat VWFD (VFlow Workflow Definition):

```yaml
version: "3.0"
metadata:
  id: kelompok1-<nama-workflow>
  name: "Kelompok 1 - <Nama Workflow>"
  dialect: vflow
  tags: [kelompok1, ...]

spec:
  activities:
    - id: <activity-id>
      activity_type: <tipe-activity>
      # ... konfigurasi activity
    
  flows:
    - { id: f01, from: { node: <from> }, to: { node: <to> } }
  
  variables:
    - { name: <var-name>, type: <type> }
```

## Environment Variables

### Variabel Wajib untuk VFlow

```bash
# VFlow Server Configuration
export VFLOW_BASE_URL="https://sqavflow.vastar.id"
export VFLOW_TENANT="_default"
export VFLOW_ADMIN_KEY="<minta-ke-pembimbing>"

# LogStream Configuration (untuk membaca log)
export LOGSTREAM_TOKEN="<minta-ke-pembimbing>"

# Pack Installation (untuk install connection pack)
export VFLOW_PACK_SECRET_KEY_B64="<minta-ke-pembimbing>"
```

### Variabel untuk Database Tunnel

```bash
# PostgreSQL Database via Tunnel
export KELOMPOK1_DATABASE_URL="postgresql://USER:PASS@db-tunnel.vastar.id:15431/DB_NAME"
export KELOMPOK1_DATABASE_NAME="nama_database"
export KELOMPOK1_DATABASE_USER="username"
export KELOMPOK1_DATABASE_PASSWORD="password"
```

### Variabel untuk Backend Lokal

```bash
# Backend bisa menggunakan localhost karena berjalan di mesin yang sama
export DATABASE_URL="postgresql://USER:PASS@127.0.0.1:5432/DB_NAME"
export PORT=3000
```

### File .env untuk Backend

Buat file `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres123@127.0.0.1:5432/kelompok1_internship
DB_FILE=  # Kosongkan karena kita pindah ke PostgreSQL

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=<your-jwt-secret-here>

# VFlow (opsional, untuk integrasi masa depan)
VFLOW_BASE_URL=https://sqavflow.vastar.id
VFLOW_TENANT=_default
```

## Setup Awal

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install pg  # PostgreSQL client

# Frontend
cd ../frontend
npm install
```

### 2. Setup PostgreSQL Lokal

```bash
# Install PostgreSQL (jika belum)
# Windows: Download dari postgresql.org
# Linux: sudo apt install postgresql postgresql-contrib

# Buat database
psql -U postgres
CREATE DATABASE kelompok1_internship;
\q

# Atau via command line
createdb -U postgres kelompok1_internship
```

### 3. Migrasi Schema dari SQLite ke PostgreSQL

Jalankan migration script untuk membuat tabel:

```bash
cd backend
node scripts/migrate-to-postgresql.js
```

### 4. Update Database Client

Ganti `backend/integrations/database.client.js` untuk menggunakan PostgreSQL:

```javascript
const { Pool } = require('pg');
const dbConfig = require('../config/db.config');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || dbConfig.DATABASE_URL
});

const run = async (sql, params = []) => {
  const result = await pool.query(sql, params);
  return { id: result.rows[0]?.id, changes: result.rowCount };
};

const get = async (sql, params = []) => {
  const result = await pool.query(sql, params);
  return result.rows[0];
};

const all = async (sql, params = []) => {
  const result = await pool.query(sql, params);
  return result.rows;
};

module.exports = { pool, run, get, all };
```

### 5. Jalankan Rathole Client

Rathole client membuat tunnel dari server VFlow ke PostgreSQL lokal:

```bash
# Install rathole (jika belum)
# Download dari: https://github.com/rapiz1/rathole/releases

# Jalankan client
rathole kel1-client.toml
```

File `kel1-client.toml` (sudah disediakan):

```toml
[remote]
addr = "db-tunnel.vastar.id:15430"

[client.services.postgresql]
local_addr = "127.0.0.1:5432"
token = "<token-rathole-kelompok1>"
```

## Provision Workflow

### 1. Set Environment Variables

```bash
export VFLOW_BASE_URL="https://sqavflow.vastar.id"
export VFLOW_TENANT="_default"
export VFLOW_ADMIN_KEY="<admin-key-anda>"
```

### 2. Provision Test Workflow

```bash
# Dari root project
cd /path/to/smart-internship-management-system

# Pastikan vflow-admin.sh tersedia
# Jika belum, copy dari toolkit VFlow
cp /home/abraham/magang/aws-test-vflow/scripts/vflow-admin.sh ./scripts/

# Jalankan provision
bash workflow/scripts/provision-vflow.sh
```

Atau manual:

```bash
./scripts/vflow-admin.sh workflows provision \
  ./workflow/vflow/01-register-test.yaml
```

### 3. Verifikasi Provision

```bash
# Cek health VFlow
curl -sS "$VFLOW_BASE_URL/api/admin/health" \
  -H "Authorization: Bearer $VFLOW_ADMIN_KEY" | jq .

# Cek route Kelompok 1
curl -sS "$VFLOW_BASE_URL/api/admin/health" \
  -H "Authorization: Bearer $VFLOW_ADMIN_KEY" \
  | jq -r '.webhook_routes[]?[0]' \
  | grep 'kelompok1'
```

Expected output:

```
/webhook/kelompok1/internship/register-test
```

## Testing

### 1. Smoke Test

```bash
# Pastikan VFLOW_BASE_URL sudah diset
export VFLOW_BASE_URL="https://sqavflow.vastar.id"

# Jalankan smoke test
bash workflow/scripts/smoke-vflow.sh
```

### 2. Manual Test dengan curl

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

Expected response:

```json
{
  "status": "received",
  "source": "vflow",
  "name": "Budi Santoso",
  "nim": "22031234",
  "email": "budi@example.com"
}
```

### 3. Baca Log dengan LogStream

```bash
export LOGSTREAM_TOKEN="<token-anda>"

# Stream logs real-time
curl -N \
  -H "Authorization: Bearer $LOGSTREAM_TOKEN" \
  "$VFLOW_BASE_URL/logs/vflow-server?tail=100&follow=true&timestamps=true"
```

### 4. Test Backend Lokal

```bash
# Jalankan backend
cd backend
npm run dev

# Test endpoint lokal
curl -sS http://localhost:3000/api/health | jq .
```

## Database Migration

### 1. Install PostgreSQL Driver

```bash
cd backend
npm install pg
```

### 2. Update Konfigurasi Database

Edit `backend/config/db.config.js`:

```javascript
module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  // DB_FILE dihapus karena kita pindah ke PostgreSQL
};
```

### 3. Buat Migration Script

Buat `backend/scripts/migrate-to-postgresql.js`:

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration...');
    
    // Baca schema dari file SQL
    const schemaPath = path.join(__dirname, '..', 'schema-postgresql.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Jalankan schema
    await client.query(schema);
    
    console.log('✓ Migration completed successfully');
    
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
```

### 4. Buat Schema PostgreSQL

Buat `backend/schema-postgresql.sql`:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  nim TEXT UNIQUE,
  nip TEXT UNIQUE,
  email TEXT UNIQUE,
  prodi TEXT,
  year TEXT,
  phone TEXT,
  password TEXT,
  role TEXT,
  gpa REAL DEFAULT 0,
  semester INTEGER DEFAULT 1,
  organization_exp INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Internships table
CREATE TABLE IF NOT EXISTS internships (
  id SERIAL PRIMARY KEY,
  user_email TEXT,
  name TEXT,
  nim TEXT,
  prodi TEXT,
  year TEXT,
  phone TEXT,
  motivation TEXT,
  skills TEXT,
  certificates TEXT,
  documents TEXT,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  company TEXT,
  company_bidang TEXT,
  pembimbing_email TEXT,
  eligibility_score INTEGER DEFAULT 0,
  eligibility_passed INTEGER DEFAULT 0,
  match_score INTEGER DEFAULT 0,
  final_score REAL DEFAULT 0,
  grade TEXT DEFAULT '-',
  certificate_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  internship_id INTEGER REFERENCES internships(id),
  week INTEGER,
  note TEXT,
  file_path TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
  id SERIAL PRIMARY KEY,
  student_id TEXT,
  internship_id INTEGER REFERENCES internships(id),
  score INTEGER,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE,
  city TEXT,
  bidang TEXT,
  quota INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workflow logs table
CREATE TABLE IF NOT EXISTS workflow_logs (
  id SERIAL PRIMARY KEY,
  workflow_name TEXT,
  status TEXT,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  internship_id INTEGER REFERENCES internships(id),
  assessment_type TEXT,
  score REAL,
  result TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Placements table
CREATE TABLE IF NOT EXISTS placements (
  id SERIAL PRIMARY KEY,
  internship_id INTEGER REFERENCES internships(id),
  company_id INTEGER,
  company_name TEXT,
  match_score INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  internship_id INTEGER REFERENCES internships(id),
  user_email TEXT,
  certificate_code TEXT UNIQUE,
  final_score REAL,
  grade TEXT,
  issued_at TIMESTAMP DEFAULT NOW()
);

-- Events log table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  event_name TEXT,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_internships_status ON internships(status);
CREATE INDEX IF NOT EXISTS idx_internships_user_email ON internships(user_email);
CREATE INDEX IF NOT EXISTS idx_reports_internship_id ON reports(internship_id);
CREATE INDEX IF NOT EXISTS idx_placements_internship_id ON placements(internship_id);
```

### 5. Jalankan Migration

```bash
export DATABASE_URL="postgresql://postgres:postgres123@127.0.0.1:5432/kelompok1_internship"
node backend/scripts/migrate-to-postgresql.js
```

### 6. Migrasi Data dari SQLite (opsional)

Jika ada data di SQLite yang perlu dipindah:

```bash
# Install sqlite3 dan pg
npm install sqlite3 pg

# Buat script migrasi
node backend/scripts/migrate-sqlite-to-postgresql.js
```

## Install Connection Pack

### 1. Set Environment Variables

```bash
export VFLOW_BASE_URL="https://sqavflow.vastar.id"
export VFLOW_TENANT="_default"
export VFLOW_ADMIN_KEY="<admin-key-anda>"
export VFLOW_PACK_SECRET_KEY_B64="<pack-secret-key-anda>"
export KELOMPOK1_DATABASE_NAME="kelompok1_internship"
export KELOMPOK1_DATABASE_USER="postgres"
export KELOMPOK1_DATABASE_PASSWORD="password"
```

### 2. Install Pack

```bash
./scripts/vflow-admin.sh packs install \
  ./workflow/vflow/pack.yaml
```

### 3. Verifikasi Pack

```bash
./scripts/vflow-admin.sh packs list | grep kelompok1
```

## Troubleshooting

### Error: "no workflow for path"

**Penyebab:** Workflow belum diprovision atau path salah.

**Solusi:**
1. Cek `webhook_config.path` di workflow YAML
2. Provision ulang: `bash workflow/scripts/provision-vflow.sh`
3. Cek route: `curl $VFLOW_BASE_URL/api/admin/health | grep kelompok1`

### Error: "unauthorized: invalid or missing admin API key"

**Penyebab:** `VFLOW_ADMIN_KEY` belum diset atau salah.

**Solusi:**
```bash
export VFLOW_ADMIN_KEY="<key-anda>"
```

### Error: "missing bearer token"

**Penyebab:** Request LogStream tanpa header Authorization.

**Solusi:**
```bash
curl -N \
  -H "Authorization: Bearer $LOGSTREAM_TOKEN" \
  "$VFLOW_BASE_URL/logs/vflow-server?tail=100&follow=true"
```

### Error: "graph error: workflow failed"

**Penyebab:** Ada error di dalam workflow.

**Solusi:**
1. Cek LogStream untuk melihat error detail
2. Validasi YAML workflow dengan `vflow-admin.sh workflows validate`
3. Cek activity yang gagal di log

### Connector DB gagal

**Penyebab:** Tunnel mati, DSN salah, atau schema belum ada.

**Solusi:**
1. Pastikan rathole client berjalan: `rathole kel1-client.toml`
2. Cek DSN di pack.yaml menggunakan `db-tunnel.vastar.id:15431`
3. Pastikan tabel sudah dibuat di PostgreSQL
4. Test koneksi: `psql $KELOMPOK1_DATABASE_URL`

### Response kosong/tidak sesuai

**Penyebab:** `EndTrigger` atau `final_response` salah.

**Solusi:**
1. Cek `end_activity` di trigger config
2. Cek `trigger_ref` di EndTrigger
3. Cek `output_variable` dan `final_response` mapping

## Checklist Sebelum Bertanya

Sebelum melaporkan masalah, pastikan:

- [ ] Workflow YAML menggunakan format VWFD, bukan YAML konseptual
- [ ] `metadata.id` unik dan menggunakan prefix `kelompok1`
- [ ] `webhook_config.path` menggunakan prefix `/webhook/kelompok1/...`
- [ ] Workflow sudah diprovision dengan `VFLOW_ADMIN_KEY`
- [ ] Route muncul di `api/admin/health`
- [ ] POST dilakukan ke path webhook yang sama persis
- [ ] Connection pack sudah diinstall
- [ ] DSN connection pack menggunakan `db-tunnel.vastar.id:15431`
- [ ] Backend sudah tidak bergantung pada `backend/data.sqlite`
- [ ] LogStream dipakai untuk membaca log, bukan untuk mengaktifkan workflow

## Referensi

- Toolkit VFlow: `/home/abraham/magang/aws-test-vflow`
- VFlow Authoring Guide: `vflow-authoring-guide/06-pack-tier.md`
- Provision Pattern: `provision-pattern/066-hot-connection-pack-provision`
- Cheat Sheet: `docs/VFLOW_CHEATSHEET.md`

## Kontak

Jika memerlukan token atau kredensial:
- VFLOW_ADMIN_KEY: Minta ke pembimbing
- LOGSTREAM_TOKEN: Minta ke pembimbing
- VFLOW_PACK_SECRET_KEY_B64: Minta ke pembimbing
- Rathole token: Minta ke pembimbing

**Jangan commit token ke GitHub!**
