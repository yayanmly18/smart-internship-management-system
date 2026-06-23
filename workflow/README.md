# Smart Internship Management System - Workflow Documentation

## Event-Driven Architecture Overview

Sistem ini menggunakan arsitektur **event-driven** dengan komponen-komponen berikut:

- **VFlow Workflow Engine**: Engine untuk menjalankan workflow berbasis state machine
- **NATS Event Bus**: Message broker untuk komunikasi antar komponen
- **Detach Activity**: Aktivitas yang dijalankan secara asynchronous untuk audit logging
- **Audit Logging**: Pencatatan lengkap semua aktivitas untuk compliance dan tracking
- **Starlark Activity**: Script execution engine untuk business logic yang kompleks
- **VRule (Validation Rule)**: Aturan validasi berbasis YAML untuk decision making

---

## Workflow Registry

### Workflow 1 - Internship Registration
**ID**: `wf_registration`  
**Trigger**: `InternshipSubmitted`  
**Status Output**: `REGISTERED` atau `INCOMPLETE_DOCUMENT`  
**Next Event**: `EligibilityRequested` atau `DocumentUploadRequired`

**Tujuan**: Menerima dan mendaftarkan permintaan magang baru dari mahasiswa dengan wajib upload dokumen

**Alur Proses**:
1. Validasi input dari mahasiswa
2. Cek kelengkapan upload dokumen
3. Upload dokumen (KRS, Transkrip, Surat Pengantar, CV, Portfolio)
4. Validasi file yang diupload (format, size, quality)
5. Generate internship ID unik
6. Simpan ke database
7. Catat audit log (detach activity)

**Input**:
- `student_id`: ID mahasiswa
- `student_data`: Data lengkap mahasiswa
- `internship_period`: Periode magang
- `company_preferences`: Preferensi perusahaan (opsional)
- `uploaded_documents`: Dokumen yang diupload
  - `krs`: Kartu Rencana Studi (PDF/JPG/PNG, max 5MB)
  - `transcript`: Transkrip nilai (PDF/JPG/PNG, max 5MB)
  - `internship_letter`: Surat pengantar magang (PDF/JPG/PNG, max 3MB)
  - `cv`: Curriculum Vitae (PDF/DOCX/JPG/PNG, max 3MB)
  - `portfolio`: Portofolio (PDF/DOCX/ZIP, max 10MB, opsional)

**Output**:
- `internship_id`: ID unik magang
- `status`: REGISTERED atau INCOMPLETE_DOCUMENT
- `registration_timestamp`: Waktu pendaftaran
- `document_validation_result`: Hasil validasi dokumen

**Event yang Dipublish**:
- `EligibilityRequested` - Memicu Workflow 2 (Eligibility Assessment) jika REGISTERED
- `DocumentUploadRequired` - Meminta mahasiswa upload dokumen jika INCOMPLETE_DOCUMENT

**Detach Activity**:
- `audit_log`: Mencatat event `InternshipSubmitted` dengan detail lengkap dan status upload dokumen

**Rule yang Digunakan**:
- **VRule**: `vrule_document_validation`
  - Condition:
    - `required_documents_uploaded`: true
    - `file_formats_valid`: true
    - `file_sizes_valid`: true
    - `document_quality_check`: PASS
  - Logic: AND
  - Action: if_true → VALID, if_false → INVALID

**Starlark Activity**:
- `document_validation.star`: `execute_document_validation(input_data)`
  - `validate_file_format()`: Validasi format file (PDF, JPG, PNG, DOCX, ZIP)
  - `validate_file_size()`: Validasi ukuran file per dokumen dan total
  - `validate_document_quality()`: Validasi kualitas dokumen (readability, completeness, authenticity, relevance)
  - `validate_all_documents()`: Validasi semua dokumen yang diupload
  - `generate_document_upload_summary()`: Generate ringkasan upload

**Business Rules**:
1. Mahasiswa wajib upload 5 dokumen (4 wajib + 1 opsional)
2. Format file harus sesuai (PDF, JPG, PNG, DOCX, ZIP)
3. Ukuran file per dokumen ada batas maksimal
4. Total ukuran semua dokumen maksimal 25MB
5. Dokumen harus dapat dibaca (quality check)
6. Virus scan required untuk semua file

---

### Workflow 2 - Eligibility Assessment
**ID**: `wf_eligibility`  
**Trigger**: `EligibilityRequested`  
**Status Output**: `ELIGIBILITY_DONE`  
**Next Event**: `EligibilityCompleted`

**Tujuan**: Menilai kelayakan mahasiswa untuk mengikuti program magang berdasarkan kriteria akademik

**Alur Proses**:
1. Fetch data mahasiswa dari database
2. Jalankan Starlark script untuk menghitung eligibility score
3. Terapkan VRule untuk menentukan kelayakan
4. Simpan hasil penilaian
5. Catat audit log (detach activity)

**Input**:
- `internship_id`: ID magang
- `student_id`: ID mahasiswa
- `academic_data`: Data akademik (IPK, semester, dll)
- `certificates`: Sertifikat yang dimiliki
- `organization_exp`: Pengalaman organisasi

**Output**:
- `eligibility_score`: Skor kelayakan (0-100)
- `eligible`: Boolean (true/false)
- `status`: ELIGIBLE atau NOT_ELIGIBLE
- `assessment_details`: Detail penilaian

**Event yang Dipublish**:
- `EligibilityCompleted` - Memicu Workflow 3 (Admin Verification) jika ELIGIBLE
- `EligibilityRejected` - Menghentikan proses jika NOT_ELIGIBLE

**Detach Activity**:
- `audit_log`: Mencatat hasil eligibility assessment dengan score dan status

**Rule yang Digunakan**:
- **VRule**: `vrule_eligibility_check`
  - Condition: GPA >= 3.0, Semester >= 5
  - Logic: AND
  - Action: if_true → ELIGIBLE, if_false → NOT_ELIGIBLE

**Starlark Activity**:
- `eligibility.star`: `calculate_eligibility(gpa, semester, certificate_count, organization_exp)`

---

### Workflow 3 - Admin Verification
**ID**: `wf_admin_verification`  
**Trigger**: `EligibilityCompleted`  
**Status Output**: `ADMIN_VERIFIED`, `REJECTED`, atau `REVISION_REQUIRED`  
**Next Event**: `AdminVerificationCompleted`, `AdminVerificationRejected`, atau `DocumentRevisionRequested`

**Tujuan**: Melakukan verifikasi menyeluruh oleh admin terhadap dokumen yang diupload, data akademik, dan persyaratan administrasi mahasiswa

**Alur Proses**:
1. Fetch dokumen yang diupload mahasiswa
2. Review dokumen berdasarkan hasil validasi
3. Review data akademik untuk validasi konsistensi
4. Review persyaratan administrasi (pembayaran, surat bebas tanggungan)
5. Jalankan Starlark script untuk verifikasi komprehensif
6. Terapkan VRule untuk menentukan hasil verifikasi
7. Simpan hasil verifikasi
8. Catat audit log (detach activity)
9. Publish event hasil verifikasi

**Input**:
- `internship_id`: ID magang
- `student_id`: ID mahasiswa
- `eligibility_result`: Hasil dari Eligibility Assessment
- `uploaded_documents`: Dokumen yang diupload mahasiswa
- `document_validation_result`: Hasil validasi dokumen
- `academic_data`: Data akademik untuk validasi
  - `gpa`: Indeks Prestasi Kumulatif
  - `semester`: Semester saat ini
  - `enrollment_status`: Status pendaftaran (ACTIVE/INACTIVE)
- `administrative_data`: Data administrasi
  - `payment_status`: Status pembayaran (PAID/UNPAID)
  - `clearance_letter`: Surat bebas tanggungan
  - `registration_valid`: Validitas registrasi
- `verified_by`: ID admin yang melakukan verifikasi
- `verification_timestamp`: Waktu verifikasi

**Output**:
- `verification_id`: ID unik verifikasi
- `status`: ADMIN_VERIFIED, REJECTED, atau REVISION_REQUIRED
- `verified`: Boolean (true/false)
- `document_status`: COMPLETE, INCOMPLETE, atau REVISION_REQUIRED
- `academic_status`: VALID atau INVALID
- `administrative_status`: MET atau NOT_MET
- `document_review_result`: Hasil review dokumen
  - `review_score`: Skor review (0-100)
  - `review_details`: Detail review per dokumen
  - `revision_required`: Boolean
  - `revision_items`: Item yang perlu direvisi
- `verification_score`: Skor verifikasi (0-100)
- `rejection_reasons`: Array alasan penolakan
- `verification_details`: Detail verifikasi per kategori
- `recommendation`: Rekomendasi
- `report`: Laporan lengkap verifikasi

**Event yang Dipublish**:
- `AdminVerificationCompleted` - Memicu Workflow 4 (Supervisor Approval) jika ADMIN_VERIFIED
- `AdminVerificationRejected` - Menghentikan proses jika REJECTED
- `DocumentRevisionRequested` - Memicu Workflow 3.1 (Document Revision) jika REVISION_REQUIRED

**Detach Activity**:
- `audit_log`: Mencatat seluruh proses verifikasi admin dengan detail lengkap

**Rule yang Digunakan**:
- **VRule**: `vrule_admin_verification`
  - Condition:
    - `document_complete`: true
    - `academic_data_valid`: true
    - `administrative_requirements_met`: true
    - `eligibility_status`: ELIGIBLE
  - Logic: AND
  - Action: if_true → ADMIN_VERIFIED, if_false → REJECTED

**Starlark Activity**:
- `admin_verification.star`: `execute_admin_verification(input_data)`
  - `verify_document_review()`: Review dokumen berdasarkan validasi
  - `verify_admin_requirements()`: Verifikasi 3 kategori (dokumen, akademik, administrasi)
  - `calculate_verification_score()`: Hitung skor verifikasi
  - `generate_verification_report()`: Generate laporan lengkap

**Business Rules**:
1. Semua dokumen wajib harus lengkap dan valid
2. Data akademik harus konsisten dengan hasil eligibility assessment
3. Mahasiswa harus dalam status enrollment ACTIVE
4. Pembayaran harus lunas (PAID)
5. Surat bebas tanggungan harus ada
6. Status eligibility harus ELIGIBLE
7. Jika dokumen kurang valid, admin bisa minta revisi

**Input**:
- `internship_id`: ID magang
- `student_id`: ID mahasiswa
- `eligibility_result`: Hasil dari Eligibility Assessment
- `document_data`: Data dokumen lengkap
  - `krs`: Kartu Rencana Studi
  - `transcript`: Transkrip nilai
  - `internship_letter`: Surat pengantar magang
  - `cv`: Curriculum Vitae
  - `portfolio`: Portofolio karya
- `academic_data`: Data akademik untuk validasi
  - `gpa`: Indeks Prestasi Kumulatif
  - `semester`: Semester saat ini
  - `enrollment_status`: Status pendaftaran (ACTIVE/INACTIVE)
- `administrative_data`: Data administrasi
  - `payment_status`: Status pembayaran (PAID/UNPAID)
  - `clearance_letter`: Surat bebas tanggungan
  - `registration_valid`: Validitas registrasi
- `verified_by`: ID admin yang melakukan verifikasi
- `verification_timestamp`: Waktu verifikasi

**Output**:
- `verification_id`: ID unik verifikasi
- `status`: ADMIN_VERIFIED atau REJECTED
- `verified`: Boolean (true/false)
- `document_status`: COMPLETE atau INCOMPLETE
- `academic_status`: VALID atau INVALID
- `administrative_status`: MET atau NOT_MET
- `verification_score`: Skor verifikasi (0-100)
  - Document Score: 40 points max
  - Academic Score: 35 points max
  - Administrative Score: 25 points max
- `rejection_reasons`: Array alasan penolakan (jika rejected)
  - INCOMPLETE_DOCUMENT
  - INVALID_ACADEMIC_DATA
  - ADMINISTRATIVE_REQUIREMENTS_NOT_MET
  - NOT_ELIGIBLE
- `verification_details`: Detail verifikasi per kategori
- `recommendation`: Rekomendasi (EXCELLENT/GOOD/PASS/REJECT)
- `report`: Laporan lengkap verifikasi

**Event yang Dipublish**:
- `AdminVerificationCompleted` - Memicu Workflow 4 (Supervisor Approval) jika ADMIN_VERIFIED
- `AdminVerificationRejected` - Menghentikan proses jika REJECTED

**Detach Activity**:
- `audit_log`: Mencatat seluruh proses verifikasi admin dengan detail:
  - Admin ID yang melakukan verifikasi
  - Timestamp verifikasi
  - Status verifikasi
  - Skor verifikasi
  - Alasan penolakan (jika ada)
  - Detail verifikasi per kategori

**Rule yang Digunakan**:
- **VRule**: `vrule_admin_verification`
  - Condition:
    - `document_complete`: true
    - `academic_data_valid`: true
    - `administrative_requirements_met`: true
    - `eligibility_status`: ELIGIBLE
  - Logic: AND
  - Action: if_true → ADMIN_VERIFIED, if_false → REJECTED

**Starlark Activity**:
- `admin_verification.star`: `execute_admin_verification(input_data)`
  - `verify_admin_requirements()`: Verifikasi 3 kategori (dokumen, akademik, administrasi)
  - `calculate_verification_score()`: Hitung skor verifikasi
  - `generate_verification_report()`: Generate laporan lengkap

**Business Rules**:
1. Semua dokumen wajib harus lengkap (KRS, transkrip, surat pengantar, CV, portfolio)
2. Data akademik harus konsisten dengan hasil eligibility assessment
3. Mahasiswa harus dalam status enrollment ACTIVE
4. Pembayaran harus lunas (PAID)
5. Surat bebas tanggungan harus ada
6. Status eligibility harus ELIGIBLE

---

### Workflow 4 - Supervisor Approval
**ID**: `wf_supervisor_approval`  
**Trigger**: `AdminVerificationCompleted`  
**Status Output**: `SUPERVISOR_APPROVED` atau `REJECTED`  
**Next Event**: `SupervisorDecision` atau `SupervisorDecisionRejected`

**Tujuan**: Melakukan approval akhir oleh Dosen Pembimbing (Supervisor) setelah lolos verifikasi admin

**Alur Proses**:
1. Kirim permintaan approval ke supervisor
2. Tunggu respons dari supervisor
3. Verifikasi wewenang supervisor untuk mahasiswa tersebut
4. Validasi keputusan supervisor berdasarkan business rules
5. Terapkan VRule untuk menentukan hasil approval
6. Hitung skor approval komprehensif
7. Simpan keputusan
8. Catat audit log (detach activity)
9. Publish event hasil approval

**Input**:
- `internship_id`: ID magang
- `student_id`: ID mahasiswa
- `supervisor_id`: ID Dosen Pembimbing
- `admin_verification_result`: Hasil verifikasi admin
- `admin_verification_score`: Skor verifikasi admin (0-100)
- `document_quality`: Penilaian kualitas dokumen (0-10)
- `academic_readiness`: Kesiapan akademik (0-10)
- `administrative_compliance`: Kepatuhan administrasi (0-10)
- `supervisor_assignments`: Daftar penugasan supervisor
  - Format: `[{supervisor_id, student_id, assignment_date, status}]`
- `previous_decisions`: Daftar keputusan sebelumnya
- `decision`: APPROVED atau REJECTED
- `rejection_reason`: Alasan penolakan (jika rejected)
- `notes`: Catatan dari supervisor
- `approval_timestamp`: Waktu approval
- `approved_by`: ID supervisor yang melakukan approval

**Output**:
- `approval_id`: ID unik approval
- `status`: SUPERVISOR_APPROVED atau REJECTED
- `approved`: Boolean (true/false)
- `supervisor_authorized`: Boolean (true/false)
- `decision_valid`: Boolean (true/false)
- `score_analysis`: Analisis skor komprehensif
  - `admin_verification_score`: 0-100
  - `document_quality_score`: 0-10
  - `academic_readiness_score`: 0-10
  - `administrative_compliance_score`: 0-10
  - `total_score`: 0-130
  - `percentage`: Persentase skor
- `recommendation`: Rekomendasi sistem
  - STRONG_APPROVE (>= 120)
  - APPROVE (>= 100)
  - APPROVE_WITH_CONDITIONS (>= 85)
  - REVIEW_REQUIRED (>= 70)
  - REJECT (< 70)
- `rejection_reasons`: Array alasan penolakan (jika rejected)
  - ADMIN_VERIFICATION_NOT_PASSED
  - SUPERVISOR_REJECTED
  - SUPERVISOR_NOT_AUTHORIZED
  - INVALID_DECISION
- `warnings`: Array peringatan
  - REJECTING_AFTER_ADMIN_VERIFIED
- `approval_details`: Detail lengkap approval
- `report`: Laporan lengkap approval

**Event yang Dipublish**:
- `SupervisorDecision` - Memicu Workflow 5 (Company Placement Engine) jika SUPERVISOR_APPROVED
- `SupervisorDecisionRejected` - Menghentikan proses jika REJECTED

**Detach Activity**:
- `audit_log`: Mencatat seluruh proses supervisor approval dengan detail:
  - Supervisor ID yang melakukan approval
  - Timestamp approval
  - Status approval
  - Skor komprehensif
  - Keputusan (APPROVED/REJECTED)
  - Alasan penolakan (jika ada)
  - Warnings yang muncul
  - Detail authority check

**Rule yang Digunakan**:
- **VRule**: `vrule_supervisor_approval`
  - Condition:
    - `admin_verification_status`: ADMIN_VERIFIED
    - `supervisor_decision`: APPROVED
    - `supervisor_has_authority`: true
  - Logic: AND
  - Action: if_true → SUPERVISOR_APPROVED, if_false → REJECTED

**Starlark Activity**:
- `supervisor_approval.star`: `execute_supervisor_approval(input_data)`
  - `verify_supervisor_authority()`: Verifikasi supervisor berwenang
  - `validate_supervisor_decision()`: Validasi keputusan supervisor
  - `calculate_supervisor_approval_score()`: Hitung skor approval
  - `process_supervisor_approval()`: Proses keputusan
  - `generate_approval_report()`: Generate laporan lengkap

**Business Rules**:
1. Admin verification harus lolos sebelum supervisor approval
2. Supervisor harus sudah ditugaskan ke mahasiswa tersebut
3. Supervisor tidak boleh approve mahasiswa yang menjadi kerabat/dekat (warning)
4. Keputusan supervisor tidak boleh duplikat
5. Hanya ada dua nilai decision: APPROVED atau REJECTED

---

### Workflow 3.1 - Document Revision
**ID**: `wf_document_revision`  
**Trigger**: `DocumentRevisionRequested`  
**Status Output**: `REVISION_SUBMITTED` atau `REJECTED`  
**Next Event**: `EligibilityRequested` atau `AdminVerificationRejected`

**Tujuan**: Memungkinkan mahasiswa merevisi dan mengupload ulang dokumen yang tidak valid sesuai permintaan admin

**Alur Proses**:
1. Kirim notifikasi revisi ke mahasiswa
2. Tunggu mahasiswa upload dokumen revisi
3. Validasi dokumen yang sudah direvisi
4. Jalankan Starlark untuk validasi dokumen
5. Terapkan VRule untuk hasil validasi
6. Simpan hasil revisi
7. Catat audit log (detach activity)
8. Publish event hasil revisi

**Input**:
- `internship_id`: ID magang
- `student_id`: ID mahasiswa
- `revision_items`: Item yang perlu direvisi
  - `action`: ADD_DOCUMENT, REPLACE_DOCUMENT, IMPROVE_QUALITY, CORRECT_CONTENT, MANUAL_REVIEW
  - `document_type`: Jenis dokumen
  - `reason`: Alasan revisi
- `revised_documents`: Dokumen yang diupload ulang
- `revision_deadline`: Batas waktu revisi
- `revision_timestamp`: Waktu revisi

**Output**:
- `revision_id`: ID unik revisi
- `status`: REVISION_SUBMITTED atau REJECTED
- `revision_score`: Skor revisi
- `validation_result`: Hasil validasi dokumen revisi
- `revision_details`: Detail revisi
- `revision_accepted`: Boolean

**Event yang Dipublish**:
- `EligibilityRequested` - Memicu Workflow 2 (Eligibility Assessment) jika REVISION_SUBMITTED
- `AdminVerificationRejected` - Menghentikan proses jika REVISION_REJECTED (melebihi batas waktu)

**Detach Activity**:
- `audit_log`: Mencatat proses revisi dokumen

**Rule yang Digunakan**:
- **VRule**: `vrule_document_validation`
  - Validasi dokumen yang sudah direvisi
  - Sama seperti validasi awal

**Starlark Activity**:
- `document_validation.star`: `execute_document_validation(input_data)`
  - Validasi dokumen revisi

**Business Rules**:
1. Mahasiswa harus merevisi sesuai item yang diminta admin
2. Ada batas waktu revisi (misal: 7 hari)
3. Maksimal 3 kali revisi
4. Jika revisi tidak memenuhi, proses dihentikan

---

### Workflow 5 - Company Placement Engine
**ID**: `wf_placement`  
**Trigger**: `SupervisorDecision`  
**Status Output**: `COMPANY_ASSIGNED`  
**Next Event**: `CompanyAssigned`

**Tujuan**: Menempatkan mahasiswa ke perusahaan yang sesuai berdasarkan kriteria dan preferensi

**Alur Proses**:
1. Fetch daftar perusahaan dari database
2. Jalankan Starlark script untuk matching algoritma
3. Terapkan VRule untuk validasi penempatan
4. Assign perusahaan ke mahasiswa
5. Publish event hasil penempatan

**Input**:
- `internship_id`: ID magang
- `student_id`: ID mahasiswa
- `student_profile`: Profil lengkap mahasiswa
- `company_list`: Daftar perusahaan tersedia
- `placement_criteria`: Kriteria penempatan
- `supervisor_approved_data`: Data approval supervisor

**Output**:
- `placement_id`: ID penempatan
- `company_id`: ID perusahaan yang ditugaskan
- `company_name`: Nama perusahaan
- `placement_status`: COMPANY_ASSIGNED
- `placement_details`: Detail penempatan

**Event yang Dipublish**:
- `CompanyAssigned` - Memicu Workflow 6 (Weekly Progress Monitoring)

**Detach Activity**:
- Tidak ada detach activity khusus (proses cepat)

**Rule yang Digunakan**:
- **VRule**: `vrule_company_matching`
  - Validasi kecocokan profil mahasiswa dengan perusahaan
  - Validasi kuota perusahaan
  - Validasi bidang yang sesuai

**Starlark Activity**:
- `company_matching.star`: Algoritma matching mahasiswa-perusahaan

---

### Workflow 6 - Weekly Progress Monitoring
**ID**: `wf_monitoring`  
**Trigger**: `ProgressSubmitted`  
**Status Output**: `PROGRESS_VALIDATED`  
**Next Event**: `ProgressUpdated`

**Tujuan**: Memantau dan memvalidasi laporan kemajuan mingguan mahasiswa selama magang

**Alur Proses**:
1. Validasi laporan kemajuan
2. Terapkan VRule untuk compliance
3. Simpan data kemajuan
4. Catat audit log (detach activity)
5. Publish event update kemajuan

**Input**:
- `internship_id`: ID magang
- `student_id`: ID mahasiswa
- `week_number`: Nomor minggu
- `progress_report`: Laporan kemajuan
- `activities_done`: Aktivitas yang dilakukan
- `hours_worked`: Jam kerja
- `challenges`: Tantangan yang dihadapi
- `learning_outcomes`: Hasil pembelajaran

**Output**:
- `progress_id`: ID progress
- `validation_status`: PROGRESS_VALIDATED
- `compliance_score`: Skor kepatuhan
- `feedback`: Feedback dari sistem

**Event yang Dipublish**:
- `ProgressUpdated` - Update status kemajuan

**Detach Activity**:
- `audit_log`: Mencatat laporan kemajuan mingguan

**Rule yang Digunakan**:
- **VRule**: `vrule_progress_compliance`
  - Validasi kelengkapan laporan
  - Validasi minimal jam kerja
  - Validasi konten laporan

---

### Workflow 7 - Performance Evaluation
**ID**: `wf_evaluation`  
**Trigger**: `EvaluationRequested`  
**Status Output**: `EVALUATED`  
**Next Event**: `EvaluationCompleted`

**Tujuan**: Mengevaluasi kinerja mahasiswa selama program magang

**Alur Proses**:
1. Kumpulkan semua data (progress, feedback, attendance)
2. Jalankan Starlark script untuk grading
3. Terapkan VRule untuk penilaian kinerja
4. Simpan hasil evaluasi
5. Publish event hasil evaluasi

**Input**:
- `internship_id`: ID magang
- `student_id`: ID mahasiswa
- `all_progress_data`: Semua data kemajuan
- `supervisor_feedback`: Feedback dari supervisor
- `company_evaluation`: Evaluasi dari perusahaan
- `attendance_data`: Data kehadiran

**Output**:
- `evaluation_id`: ID evaluasi
- `final_grade`: Nilai akhir (A/B/C/D/E)
- `score`: Skor numerik (0-100)
- `evaluation_status`: EVALUATED
- `evaluation_details`: Detail evaluasi

**Event yang Dipublish**:
- `EvaluationCompleted` - Memicu Workflow 8 (Certification & Completion)

**Detach Activity**:
- Tidak ada detach activity khusus

**Rule yang Digunakan**:
- **VRule**: `vrule_performance_grading`
  - Grading berdasarkan skor
  - Validasi kelulusan

**Starlark Activity**:
- `performance_grading.star`: Algoritma penilaian kinerja

---

### Workflow 8 - Certification & Completion
**ID**: `wf_certification`  
**Trigger**: `EvaluationCompleted`  
**Status Output**: `COMPLETED`  
**Next Event**: `InternshipCompleted`

**Tujuan**: Menerbitkan sertifikat penyelesaian magang dan menandai proses sebagai selesai

**Alur Proses**:
1. Verifikasi skor akhir
2. Terapkan VRule untuk penerbitan sertifikat
3. Generate sertifikat
4. Simpan sertifikat ke database
5. Catat audit log (detach activity)
6. Publish event penyelesaian

**Input**:
- `internship_id`: ID magang
- `student_id`: ID mahasiswa
- `evaluation_result`: Hasil evaluasi kinerja
- `final_score`: Skor akhir
- `student_info`: Informasi lengkap mahasiswa
- `company_info`: Informasi perusahaan
- `completion_date`: Tanggal penyelesaian

**Output**:
- `certificate_id`: ID sertifikat
- `certificate_number`: Nomor sertifikat unik
- `certificate_url`: URL/link sertifikat
- `completion_status`: COMPLETED
- `final_grade`: Nilai akhir
- `completion_timestamp`: Timestamp penyelesaian

**Event yang Dipublish**:
- `InternshipCompleted` - Menandai seluruh proses magang selesai

**Detach Activity**:
- `audit_log`: Mencatat penyelesaian magang dan penerbitan sertifikat

**Rule yang Digunakan**:
- **VRule**: `vrule_certificate_release`
  - Validasi skor minimal untuk sertifikat
  - Validasi kelengkapan seluruh proses

**Starlark Activity**:
- `certificate.star`: Generate sertifikat dengan template

---

## Event Flow Diagram

```
InternshipSubmitted
    ↓
[Workflow 1: Internship Registration]
    ↓
EligibilityRequested
    ↓
[Workflow 2: Eligibility Assessment]
    ↓
EligibilityCompleted (jika ELIGIBLE)
    ↓
[Workflow 3: Admin Verification] ← NEW TWO-STAGE APPROVAL
    ↓
AdminVerificationCompleted (jika ADMIN_VERIFIED)
    ↓
[Workflow 4: Supervisor Approval] ← NEW TWO-STAGE APPROVAL
    ↓
SupervisorDecision (jika SUPERVISOR_APPROVED)
    ↓
[Workflow 5: Company Placement Engine]
    ↓
CompanyAssigned
    ↓
[Workflow 6: Weekly Progress Monitoring] (berulang setiap minggu)
    ↓
ProgressUpdated
    ↓
[Workflow 7: Performance Evaluation]
    ↓
EvaluationCompleted
    ↓
[Workflow 8: Certification & Completion]
    ↓
InternshipCompleted
```

---

## Rejection Flow

```
EligibilityRequested
    ↓
[Workflow 2: Eligibility Assessment]
    ↓
EligibilityRejected (jika NOT_ELIGIBLE)
    ↓
STOP - Status: REJECTED

AdminVerificationCompleted
    ↓
[Workflow 3: Admin Verification]
    ↓
AdminVerificationRejected (jika REJECTED)
    ↓
STOP - Status: REJECTED

AdminVerificationCompleted
    ↓
[Workflow 4: Supervisor Approval]
    ↓
SupervisorDecisionRejected (jika REJECTED)
    ↓
STOP - Status: REJECTED
```

---

## Technology Stack

- **Workflow Engine**: VFlow (State Machine based)
- **Event Bus**: NATS (Pub/Sub messaging)
- **Scripting**: Starlark (Python-like language for business logic)
- **Validation**: VRule (YAML-based validation rules)
- **Audit**: Detach Activity Pattern (Async audit logging)
- **Database**: SQLite/PostgreSQL
- **Backend**: Node.js with Express

---

## Key Features

### 1. Event-Driven Architecture
- Setiap workflow memicu event berikutnya
- Komunikasi antar komponen melalui NATS Event Bus
- Loose coupling antar workflow

### 2. Two-Stage Approval Process
- **Stage 1**: Admin Verification - Verifikasi dokumen dan administrasi
- **Stage 2**: Supervisor Approval - Approval akhir oleh Dosen Pembimbing
- Meningkatkan kontrol kualitas dan mengurangi risiko

### 3. Audit Logging
- Setiap aktivitas penting tercatat
- Detach activity pattern untuk async logging
- Compliance dan tracking lengkap

### 4. Business Rules Engine
- VRule untuk validasi berbasis YAML
- Mudah diubah tanpa mengubah kode
- Terapkan di setiap decision point

### 5. Starlark Scripting
- Business logic yang kompleks dapat di-express dalam Starlark
- Mudah di-maintain dan di-test
- Reusable across workflows

---

## File Structure

```
workflow/
├── workflow.yaml                 # Main workflow definition
├── README.md                     # This documentation
├── starlark/                     # Starlark scripts
│   ├── eligibility.star         # Eligibility calculation
│   ├── admin_verification.star  # Admin verification logic
│   ├── supervisor_approval.star # Supervisor approval logic
│   ├── company_matching.star    # Company matching algorithm
│   ├── performance_grading.star # Performance evaluation
│   └── certificate.star         # Certificate generation
└── vrules/                       # Validation rules
    ├── vrule_eligibility_check.yaml
    ├── vrule_admin_verification.yaml      # NEW
    ├── vrule_supervisor_approval.yaml     # NEW
    ├── vrule_company_matching.yaml
    ├── vrule_progress_compliance.yaml
    ├── vrule_performance_grading.yaml
    └── vrule_certificate_release.yaml
```

---

## Implementation Notes

### VRule Structure
```yaml
rule_id: unique_rule_id
condition:
  field1: "value1"
  field2: "value2"
logic: AND | OR
action:
  if_true: STATUS_TRUE
  if_false: STATUS_FALSE
```

### Starlark Function Signature
```python
def execute_workflow_name(input_data):
    """
    Main execution function
    
    Args:
        input_data: dict with all required inputs
    
    Returns:
        dict: Complete result with status and details
    """
```

### Event Naming Convention
- `{Entity}{Action}` format
- Examples: `InternshipSubmitted`, `EligibilityCompleted`, `AdminVerificationRejected`

### Status Values
- `REGISTERED`
- `ELIGIBILITY_DONE`
- `ADMIN_VERIFIED`
- `SUPERVISOR_APPROVED`
- `COMPANY_ASSIGNED`
- `PROGRESS_VALIDATED`
- `EVALUATED`
- `COMPLETED`
- `REJECTED` (generic rejection status)

---

## Next Steps

1. Implement backend services untuk menjalankan workflow
2. Integrasi dengan NATS Event Bus
3. Implementasi Starlark Engine
4. Implementasi VRule Engine
5. Build audit logging service
6. Create API endpoints untuk setiap workflow
7. Build frontend interfaces untuk admin dan supervisor
8. Testing end-to-end workflow
9. Deployment dan monitoring

---

## Revision History

- **2026-06-22**: Initial workflow design with 8 workflows
- **2026-06-22**: Added two-stage approval process (Admin Verification + Supervisor Approval)
  - Added Workflow 3: Admin Verification
  - Added Workflow 4: Supervisor Approval
  - Created vrule_admin_verification.yaml
  - Created vrule_supervisor_approval.yaml
  - Created admin_verification.star
  - Created supervisor_approval.star
  - Updated workflow.yaml with new workflow sequence