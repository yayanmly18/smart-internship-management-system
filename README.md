# Smart Internship Management System - Kelompok 1

Workflow-based Internship Management System dengan integrasi VFlow untuk proses registrasi, approval, monitoring, evaluasi, dan sertifikasi magang.

---

## Quick Start

### 1. Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Setup Database
```bash
# Buat database PostgreSQL
psql -U postgres -c "CREATE DATABASE kelompok1_internship;"

# Setup environment
cp backend/.env.example backend/.env
# Edit backend/.env dengan kredensial PostgreSQL Anda

# Run migration
cd backend && node scripts/migrate-to-postgresql.js

# Create admin user
node scripts/seed-admin-postgres.js
```

### 3. Run Application
```bash
# Terminal 1 - Backend (port 3000)
cd backend && npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Default Login**: admin@example.com / adminpass

---

## Documentation

### Main Documentation
- **[docs/VFLOW_GUIDE.md](docs/VFLOW_GUIDE.md)** - Panduan lengkap VFlow integration (START HERE!)
- **[workflow/SETUP.md](workflow/SETUP.md)** - Setup detail VFlow
- **[workflow/COMPLETE_FLOW.md](workflow/COMPLETE_FLOW.md)** - Workflow bisnis lengkap

### Quick Reference
- **Quick Start**: Lihat bagian atas halaman ini
- **Troubleshooting**: Lihat section di `docs/VFLOW_GUIDE.md`
- **API Testing**: Gunakan curl commands di `docs/VFLOW_GUIDE.md`

---

## Tech Stack

### Backend
- **Framework**: Express.js
- **Database**: PostgreSQL 
- **Authentication**: JWT (jsonwebtoken)
- **Workflow**: VFlow (via webhook)

### Frontend
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **UI Components**: Custom components dengan Tailwind CSS
- **Charts**: Recharts

### VFlow Integration
- **Workflow Engine**: VFlow (sqavflow.vastar.id)
- **Business Rules**: VRule
- **Activities**: Starlark
- **Database Access**: Via tunnel (db-tunnel.vastar.id:15431)

---

## Project Structure

```
├── backend/
│   ├── api/                    # Controllers (auth, internship, dashboard, etc)
│   ├── config/                 # Configuration files
│   ├── integrations/           # Database client (PostgreSQL/SQLite)
│   ├── middleware/             # Auth & error middleware
│   ├── scripts/                # Migration & utility scripts
│   ├── services/               # Business logic services
│   └── app.js                  # Express server entry point
│
├── frontend/
│   ├── src/app/
│   │   ├── App.tsx             # Main React component
│   │   └── components/         # Reusable UI components
│   └── vite.config.ts          # Vite configuration
│
├── workflow/
│   ├── vflow/                  # VFlow workflow definitions
│   │   ├── 01-register-test.yaml
│   │   └── pack.yaml           # Connection pack
│   ├── vrules/                 # Business rules (VRule)
│   ├── starlark/               # Starlark scripts
│   └── scripts/                # Provision & test scripts
│
├── docs/
│   └── VFLOW_GUIDE.md          # Main VFlow documentation
│
├── setup-env.sh                # VFlow environment variables
└── kel1-client.toml            # Rathole tunnel configuration
```

---

## Key Features

1. **Internship Registration** - Multi-step registration with document upload
2. **Eligibility Assessment** - Automated scoring with Starlark
3. **Admin Verification** - Document & academic review workflow
4. **Supervisor Approval** - Approval chain with notifications
5. **Company Placement** - Automated company matching
6. **Weekly Monitoring** - Progress tracking & reporting
7. **Performance Evaluation** - Grading & feedback system
8. **Certification** - Automatic certificate generation

---

## Configuration

### Database
- **Production/VFlow**: PostgreSQL (requires setup)

### Environment Variables
See `docs/VFLOW_GUIDE.md` for complete environment setup.

---

## Testing

### Quick Tests
```bash
# Health check
curl http://localhost:3000/health

# Login test
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"adminpass","role":"admin"}'
```

### VFlow Tests
```bash
# Provision workflow
bash workflow/scripts/provision-vflow.sh

# Smoke test
bash workflow/scripts/smoke-vflow.sh
```

**Kelompok 1** - Smart Internship Management System  
**Created**: 2026-06-26 | **Version**: 1.0

Dikembangkan untuk magang dengan integrasi VFlow workflow engine.
