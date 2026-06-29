# VFlow Integration Guide - Kelompok 1

Panduan lengkap untuk menjalankan dan mengintegrasikan VFlow dengan Smart Internship Management System Kelompok 1.

---

## 🚀 Quick Start (3 Langkah)

### 1. Setup Environment
```bash
# Load environment variables
source setup-env.sh
```

### 2. Setup Database & Provision
```bash
# Buat database PostgreSQL
psql -U postgres -c "CREATE DATABASE kelompok1_internship;"

# Run migration
cd backend && node scripts/migrate-to-postgresql.js

# Provision workflow
bash workflow/scripts/provision-vflow.sh
```

### 3. Run Application
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

---

## 📋 Prerequisites

- Node.js v16+
- PostgreSQL (running locally)
- Git
- Token VFlow (dapat dari pembimbing)

---

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
```env
DATABASE_URL=postgresql://postgres:postgres123@127.0.0.1:5432/kelompok1_internship
PORT=3000
JWT_SECRET=your-secret-key-here
VFLOW_TENANT=_default
```

**VFlow (shell)**:
```bash
export VFLOW_BASE_URL="https://sqavflow.vastar.id"
export VFLOW_TENANT="_default"
export VFLOW_ADMIN_KEY="<minta-ke-pembimbing>"
export LOGSTREAM_TOKEN="<minta-ke-pembimbing>"
```

---

## ✅ Yang Sudah Disiapkan

- ✅ Test workflow: `workflow/vflow/01-register-test.yaml`
- ✅ Connection pack: `workflow/vflow/pack.yaml`
- ✅ Provision script: `workflow/scripts/provision-vflow.sh`
- ✅ Smoke test: `workflow/scripts/smoke-vflow.sh`
- ✅ Database migration: `backend/scripts/migrate-to-postgresql.js`
- ✅ Admin seeder: `backend/scripts/seed-admin-postgres.js`

---

## 🧪 Testing

### Test VFlow Webhook
```bash
bash workflow/scripts/smoke-vflow.sh
```

### Test Login
```bash
# Backend harus running di port 3000
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"adminpass","role":"admin"}'
```

### Check Health
```bash
curl http://localhost:3000/health
```

---

## 📁 Project Structure

```
├── backend/
│   ├── integrations/database.client.js  # PostgreSQL/SQLite support
│   ├── scripts/
│   │   ├── migrate-to-postgresql.js     # DB migration
│   │   └── seed-admin-postgres.js       # Create admin user
│   └── app.js                           # Express server
│
├── frontend/
│   ├── src/app/App.tsx                  # Main React app
│   └── vite.config.ts                   # Vite config (proxy to 3000)
│
├── workflow/
│   ├── vflow/
│   │   ├── 01-register-test.yaml        # Test workflow
│   │   └── pack.yaml                    # Connection pack
│   ├── scripts/
│   │   ├── provision-vflow.sh           # Provision workflow
│   │   └── smoke-vflow.sh               # Test webhook
│   └── vrules/                          # Business rules
│
├── setup-env.sh                         # VFlow tokens & config
├── kel1-client.toml                     # Rathole tunnel config
└── docs/
    └── VFLOW_GUIDE.md                   # This file
```

---

## 🎯 Key Features

### 1. Dual Database Support
- **PostgreSQL**: Primary (untuk VFlow integration)
- **SQLite**: Fallback (untuk development legacy)

### 2. VFlow Integration
- Workflow execution via webhook
- Business rules (VRule)
- Starlark activities
- Event-driven architecture

### 3. Naming Conventions (Kelompok 1)
- Workflow ID: `kelompok1-*`
- Webhook path: `/webhook/kelompok1/...`
- Connection pack: `kelompok1-internship`
- Tenant: `_default`

---

## 🆘 Troubleshooting

| Error | Solution |
|-------|----------|
| `password authentication failed` | Check PostgreSQL credentials in `.env` |
| `ECONNREFUSED` | Pastikan backend running di port 3000 |
| `no workflow for path` | Jalankan `bash workflow/scripts/provision-vflow.sh` |
| `unauthorized` | Check `VFLOW_ADMIN_KEY` atau restart dengan `source setup-env.sh` |

---

## 📚 Documentation Lainnya

- **README.md** - Project overview & installation
- **workflow/SETUP.md** - VFlow setup detail
- **workflow/COMPLETE_FLOW.md** - Workflow bisnis lengkap
- **workflow/README.md** - Workflow documentation

---

## 🔐 Security Notes

- ✅ Semua token ada di `.gitignore`
- ✅ Jangan commit `setup-env.sh` ke GitHub
- ✅ Ganti default password di production
- ✅ Gunakan HTTPS di production

---

## 📞 Contact

- VFlow tokens: Minta ke pembimbing
- Database access: Minta ke pembimbing
- Technical issues: Buat issue di GitHub

---

**Kelompok 1** - Smart Internship Management System  
**Created**: 2026-06-26 | **Version**: 1.0