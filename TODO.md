# TODO - Koneksi Page Pembimbing ke DB

## Step 1: Analisis & Update Skema DB
- [ ] Tambahkan kolom `nip` pada tabel `users`
- [x] Tambahkan kolom `pembimbing_email` pada tabel `internships`


## Step 2: Endpoint Backend Pembimbing
- [ ] GET `/api/internship/pembimbing/profile` -> nama dosen + nip berdasarkan JWT
- [ ] GET `/api/internship/pembimbing/students` -> mahasiswa bimbingan (dari internships.pembimbing_email)

## Step 3: Endpoint Admin untuk Assign Pembimbing
- [ ] Tambah endpoint admin untuk assign pembimbing ke internship
- [ ] Update query agar internships terisi `pembimbing_email`

## Step 4: Update Frontend Pembimbing (tanpa hardcode)
- [ ] Update `PDashboard` untuk fetch profil pembimbing
- [ ] Update `PStudents` untuk fetch daftar mahasiswa dari DB
- [ ] Pastikan `PFeedback` dan `PSchedule` tetap jalan (jika DB belum siap, minimal tampil fallback)

## Step 5: Testing
- [ ] Login sebagai pembimbing, cek nama & daftar mahasiswa berubah dari DB
- [ ] Login sebagai admin, cek assign pembimbing berpengaruh

---

# TODO - Perbaikan Admin Dashboard Data Mahasiswa (DB-backed)

## Step 1: Backend
- [ ] Tambahkan endpoint `GET /api/auth/applicants` (admin only) di `backend/api/auth.controller.js`.
- [ ] Ambil data dari SQLite (`users` + `internships`) dan mapping ke format tabel “Data Mahasiswa”.

## Step 2: Frontend
- [ ] Ubah `AApplicants` di `frontend/src/app/App.tsx` agar fetch dari `/api/auth/applicants`.
- [ ] Hilangkan hardcode mock `applicants` untuk tabel Data Mahasiswa.

## Step 3: Testing
- [ ] Login sebagai admin dan verifikasi tabel “Data Mahasiswa” menampilkan data dari `backend/data.sqlite`.


