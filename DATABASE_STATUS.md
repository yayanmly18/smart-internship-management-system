# Status Database - PostgreSQL

## Koneksi Database
✓ Backend menggunakan **PostgreSQL** (bukan SQLite)
✓ Database: `kelompok1_internship`
✓ Host: 127.0.0.1:5432

## Data di Database

### Users (3 total)
1. **Admin** (ID: 1)
   - Email: admin@example.com
   - Role: admin
   
2. **Pembimbing** (ID: 2)
   - Email: gs@gmail.com
   - Role: pembimbing
   - Nama: YAYAN MULD
   
3. **Mahasiswa** (ID: 3)
   - Email: 2310631170052@mahasiswa.ac.id
   - Role: mahasiswa
   - Nama: Mainfreaks
   - NIM: 2310631170052

### Internships (1 total)
1. **Internship ID: 1**
   - User: Mainfreaks (2310631170052@mahasiswa.ac.id)
   - Status: aktif
   - Progress: 13%
   - Company: -
   - Pembimbing: gs@gmail.com

### Reports (0)
- Tidak ada laporan mingguan yang diupload

### Feedbacks (0)
- Belum ada feedback dari pembimbing

## Dashboard Status

### Admin Dashboard
- Total Pendaftar: 1 (mahasiswa)
- Total Mahasiswa: 1
- Total User: 3 (1 admin + 1 pembimbing + 1 mahasiswa)
- Admin: 1
- Pembimbing: 1
- Mahasiswa Aktif: 1 (sedang magang)
- Perusahaan Mitra: 0
- Rata-rata Nilai: -

### Pembimbing Dashboard
**Masalah yang Dilaporkan:**
- Halaman "Mahasiswa Saya" menampilkan data kosong
- Halaman "Beri Feedback" menampilkan "Belum ada laporan"

**Penyebab:**
Mahasiswa belum mengupload laporan mingguan (reports) ke sistem. Progress 13% yang ditampilkan adalah data dari tabel internships, bukan dari reports.

**Solusi:**
1. Mahasiswa perlu login dan upload laporan minggu 1 di halaman "Monitoring"
2. Setelah laporan diupload, pembimbing akan melihatnya di halaman "Beri Feedback"
3. Pembimbing bisa memberikan nilai dan komentar untuk setiap laporan

## Cara Test

### Login sebagai Admin
- Email: admin@example.com
- Password: adminpass
- Role: Admin

### Login sebagai Pembimbing
- Email: gs@gmail.com
- Password: (cek di database SQLite lama atau reset)
- Role: Pembimbing

### Login sebagai Mahasiswa
- Email: 2310631170052@mahasiswa.ac.id
- Password: (cek di database SQLite lama atau reset)
- Role: Mahasiswa

## Catatan Penting

1. **Password**: Semua password di-hash, tidak bisa dibaca. Jika lupa password, harus reset via script `backend/scripts/reset-admin-password.js`

2. **Data Lama**: Data dari SQLite (3 mahasiswa, 4 internships) sudah dihapus. Sekarang hanya ada 1 mahasiswa dan 1 internship di PostgreSQL.

3. **Upload Laporan**: Untuk melihat laporan di halaman pembimbing, mahasiswa harus:
   - Login ke sistem
   - Pergi ke halaman "Monitoring"
   - Upload file laporan untuk minggu yang sesuai
   - Setelah itu pembimbing akan melihat laporan tersebut di "Beri Feedback"

4. **Progress 13%**: Ini adalah nilai default yang ada di tabel internships, bukan dari laporan yang diupload.

## Next Steps

1. Mahasiswa login dan upload laporan minggu 1
2. Pembimbing akan melihat laporan di halaman "Beri Feedback"
3. Pembimbing beri feedback/nilai
4. Data akan muncul di dashboard kedua role tersebut