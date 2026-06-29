# Database Connection Setup Guide

## Status: ✓ DATABASE BERHASIL TERHUBUNG KE DASHBOARD

### Ringkasan Masalah
Database PostgreSQL belum terhubung ke dashboard karena:
1. **Port mismatch** - Backend `.env` menggunakan port 3000, tapi `app.js` default ke 3001
2. **Frontend proxy** mengarah ke port 3000, sehingga terjadi ketidakcocokan

### Solusi yang Diterapkan

#### 1. ✓ Fixed Port Configuration
- **File**: `backend/app.js`
- **Perubahan**: Mengubah default port dari `3001` ke `3000` untuk sesuai dengan `.env`
- **Hasil**: Backend sekarang berjalan di port 3000

#### 2. ✓ Updated CORS Configuration
- **File**: `backend/app.js`
- **Perubahan**: Menambahkan `http://localhost:5174` ke allowed origins
- **Hasil**: Frontend di port 5174 bisa mengakses backend

#### 3. ✓ Database Setup
- **Database**: `kelompok1_internship` (PostgreSQL)
- **Tables Created**:
  - users
  - internships
  - reports
  - feedbacks
  - companies
  - workflow_logs
  - assessments
  - placements
  - certificates
  - events

#### 4. ✓ Admin User
- **Email**: `admin@example.com`
- **Password**: `adminpass`
- **Role**: admin
- **Status**: Sudah ada di database

### Cara Menjalankan Aplikasi

#### 1. Start Backend Server
```bash
cd backend
node app.js
```
Backend akan berjalan di `http://localhost:3000`

#### 2. Start Frontend Server
```bash
cd frontend
npx vite
```
Frontend akan berjalan di `http://localhost:5174` (atau port lain yang tersedia)

#### 3. Akses Dashboard
- Buka browser ke `http://localhost:5174`
- Login dengan akun admin:
  - Email: `admin@example.com`
  - Password: `adminpass`

### Testing Koneksi Database

#### Test 1: Health Check
```bash
curl http://localhost:3000/health
```
Expected: `{"status":"OK","service":"Smart Internship Backend"}`

#### Test 2: Database Connection
```bash
node backend/test-db-connection.js
```
Expected: `✓ PostgreSQL connected successfully`

#### Test 3: Dashboard API
```bash
node test-dashboard-api.js
```
Expected: `✓ Dashboard API responded successfully`

### Konfigurasi Database

#### Database Credentials
- **Host**: 127.0.0.1
- **Port**: 5432
- **Database**: kelompok1_internship
- **Username**: postgres
- **Password**: postgres123

#### Connection String
```
postgresql://postgres:postgres123@127.0.0.1:5432/kelompok1_internship
```

### Troubleshooting

#### Jika backend tidak bisa start:
1. Pastikan PostgreSQL running: `tasklist | findstr postgres`
2. Pastikan port 3000 tidak dipakai aplikasi lain
3. Check `.env` file di folder `backend/`

#### Jika frontend tidak bisa akses API:
1. Pastikan backend running di port 3000
2. Check CORS configuration di `backend/app.js`
3. Clear browser cache dan restart

#### Jika database connection error:
1. Test koneksi: `node backend/test-db-connection.js`
2. Check PostgreSQL service berjalan
3. Verify credentials di `backend/.env`

### Files yang Dimodifikasi

1. **backend/app.js**
   - Changed default port from 3001 to 3000
   - Updated CORS to allow port 5174

2. **backend/setup-database.js** (NEW)
   - Database initialization script
   - Creates all required tables

3. **backend/test-db-connection.js** (NEW)
   - Database connection tester

4. **test-dashboard-api.js** (NEW)
   - Dashboard API endpoint tester

### Next Steps

1. **Login ke dashboard** dengan akun admin
2. **Test semua fitur dashboard**:
   - Admin dashboard (statistik)
   - Mahasiswa dashboard
   - Pembimbing dashboard
3. **Buat user tambahan** untuk testing:
   - Mahasiswa
   - Pembimbing
4. **Test pendaftaran magang** oleh mahasiswa

### Catatan Penting

- Backend menggunakan **PostgreSQL** (bukan SQLite)
- Database sudah ter-setup dengan semua tabel yang dibutuhkan
- Admin user sudah dibuat dan siap login
- Frontend proxy mengarah ke `http://localhost:3000`
- CORS sudah dikonfigurasi untuk mengizinkan frontend

### Kontak & Support

Jika ada masalah, check:
1. Backend logs di terminal
2. Browser console (F12) untuk frontend errors
3. PostgreSQL logs untuk database errors