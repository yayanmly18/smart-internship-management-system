pdf segara ace kan aku maunya itu bear benar ngamload # Complete System Flow - End to End

## Flow Diagram Lengkap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SMART INTERNSHIP MANAGEMENT SYSTEM                   │
│                           Complete Workflow Flow                              │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                              HAPPY PATH (SUCCESS FLOW)
═══════════════════════════════════════════════════════════════════════════════

[MAHASISWA] Mendaftar Magang
       │
       │ 1. Submit pendaftaran dengan data diri
       │    - Data akademik (IPK, semester)
       │    - Informasi pribadi
       │
       ▼
┌──────────────────────────────────────────┐
│  EVENT: InternshipSubmitted              │
└──────────────────────────────────────────┘
       │
       ▼
╔═══════════════════════════════════════════════════════════════╗
║  WORKFLOW 1: INTERNSHIP REGISTRATION (wf_registration)        ║
╚═══════════════════════════════════════════════════════════════╝
       │
       ├─► validate_input
       │    └─► Cek kelengkapan data mahasiswa
       │
       ├─► require_document_upload
       │    └─► Tampilkan form upload dokumen:
       │        - KRS (Kartu Rencana Studi) - PDF/JPG/PNG, max 5MB
       │        - Transkrip Nilai - PDF/JPG/PNG, max 5MB
       │        - Surat Pengantar Magang - PDF/JPG/PNG, max 3MB
       │        - CV (Curriculum Vitae) - PDF/DOCX/JPG/PNG, max 3MB
       │        - Portfolio (opsional) - PDF/DOCX/ZIP, max 10MB
       │
       ├─► upload_documents
       │    └─► Mahasiswa upload 5 dokumen (4 wajib + 1 opsional)
       │        - Upload ke storage (cloud/local)
       │        - Generate file ID untuk setiap dokumen
       │        - Simpan metadata: file_name, file_size, file_type, upload_date
       │
       ├─► validate_uploaded_files
       │    └─► document_validation.star: execute_document_validation()
       │        ├─► validate_file_format()
       │        │   └─► Cek format setiap file sesuai allowed_formats
       │        │
       │        ├─► validate_file_size()
       │        │   └─► Cek ukuran file per dokumen dan total (max 25MB)
       │        │
       │        ├─► validate_document_quality()
       │        │   └─► Cek kualitas dokumen:
       │        │       - Readability (resolution DPI)
       │        │       - Completeness (page count)
       │        │       - Authenticity (tidak di-edit)
       │        │       - Relevance (sesuai persyaratan)
       │        │
       │        ├─► validate_all_documents()
       │        │   └─► Validasi semua dokumen:
       │        │       - Semua dokumen wajib ada
       │        │       - Semua format valid
       │        │       - Semua ukuran valid
       │        │       - Kualitas minimal 60/100
       │        │
       │        └─► generate_document_upload_summary()
       │            └─► Generate ringkasan:
       │                - total_documents: 5
       │                - valid_documents: 5
       │                - total_size_mb: 15.5 MB
       │                - status: ALL_VALID
       │
       ├─► apply_vrule_document_validation
       │    └─► vrule_document_validation.yaml
       │        - Condition:
       │            * required_documents_uploaded: true
       │            * file_formats_valid: true
       │            * file_sizes_valid: true
       │            * document_quality_check: PASS
       │        - Logic: AND
       │        - if_true: VALID
       │        - if_false: INVALID
       │
       ├─► generate_internship_id
       ├─► save_to_database
       │    └─► Simpan:
       │        - internship_id: INT001
       │        - student_id: STU001
       │        - documents: [file_ids]
       │        - document_validation_result: {...}
       │
       └─► audit_log (DETACH)
            └─► Catat:
                - Student ID
                - Timestamp upload
                - Jumlah dokumen
                - Status validasi
                - Detail setiap dokumen
       │
       │ 2. Sistem otomatis memproses eligibility
       │
       ▼
┌──────────────────────────────────────────┐
│  EVENT: EligibilityRequested              │
└──────────────────────────────────────────┘
       │
       ▼
╔═══════════════════════════════════════════════════════════════╗
║  WORKFLOW 2: ELIGIBILITY ASSESSMENT (wf_eligibility)          ║
╚═══════════════════════════════════════════════════════════════╝
       │
       ├─► fetch_student_data
       ├─► run_starlark_eligibility_score
       │    └─► eligibility.star: calculate_eligibility()
       │        - GPA >= 3.0: +25-40 poin
       │        - Semester >= 5: +20 poin
       │        - Sertifikat: +5 poin per item
       │        - Pengalaman organisasi: +3 poin per item
       │        - Total >= 60: ELIGIBLE
       │
       ├─► apply_vrule_eligibility_check
       │    └─► vrule_eligibility_check.yaml
       │        - Condition: GPA >= 3.0 AND Semester >= 5
       │        - if_true: ELIGIBLE
       │        - if_false: NOT_ELIGIBLE
       │
       ├─► save_result
       ├─► audit_log (DETACH)
       │
       ▼
┌──────────────────────────────────────────┐
│  STATUS: ELIGIBILITY_DONE                 │
│  OUTPUT: eligibility_score, eligible      │
└──────────────────────────────────────────┘
       │
       │ 3. Jika ELIGIBLE, lanjut ke Admin Verification
       │
       ▼
┌──────────────────────────────────────────┐
│  EVENT: EligibilityCompleted              │
└──────────────────────────────────────────┘
       │
       ▼
╔═══════════════════════════════════════════════════════════════╗
║  WORKFLOW 3: ADMIN VERIFICATION (wf_admin_verification)       ║
╚═══════════════════════════════════════════════════════════════╝
       │
       ├─► fetch_document_data
       │    └─► Ambil: KRS, Transkrip, Surat Pengantar, CV, Portfolio
       │
       ├─► fetch_academic_data
       │    └─► Ambil: GPA, Semester, Enrollment Status
       │
       ├─► fetch_administrative_requirements
       │    └─► Ambil: Payment Status, Clearance Letter, Registration Valid
       │
       ├─► run_starlark_admin_verification
       │    └─► admin_verification.star: execute_admin_verification()
       │        ├─► verify_admin_requirements()
       │        │   ├─► Document Verification (40 poin)
       │        │   │   - KRS: +8 poin
       │        │   │   - Transcript: +8 poin
       │        │   │   - Internship Letter: +8 poin
       │        │   │   - CV: +8 poin
       │        │   │   - Portfolio: +8 poin
       │        │   │
       │        │   ├─► Academic Verification (35 poin)
       │        │   │   - GPA >= 3.5: +20 poin
       │        │   │   - GPA >= 3.0: +15 poin
       │        │   │   - GPA >= 2.75: +10 poin
       │        │   │   - Semester >= 7: +15 poin
       │        │   │   - Semester >= 5: +10 poin
       │        │   │
       │        │   ├─► Administrative Verification (25 poin)
       │        │   │   - Payment PAID: +10 poin
       │        │   │   - Clearance Letter: +10 poin
       │        │   │   - Registration Valid: +5 poin
       │        │   │
       │        │   └─► Final Decision:
       │        │       - Semua terpenuhi + Eligible = ADMIN_VERIFIED
       │        │       - Ada yang tidak terpenuhi = REJECTED
       │        │
       │        ├─► calculate_verification_score()
       │        │   └─► Total Score: 0-100
       │        │
       │        └─► generate_verification_report()
       │            └─► Recommendation:
       │                - >= 90: EXCELLENT
       │                - >= 75: GOOD
       │                - >= 60: PASS
       │                - < 60: REJECT
       │
       ├─► apply_vrule_admin_verification
       │    └─► vrule_admin_verification.yaml
       │        - Condition:
       │            * document_complete: true
       │            * academic_data_valid: true
       │            * administrative_requirements_met: true
       │            * eligibility_status: ELIGIBLE
       │        - Logic: AND
       │        - if_true: ADMIN_VERIFIED
       │        - if_false: REJECTED
       │
       ├─► save_verification_result
       ├─► audit_log (DETACH)
       │    └─► Catat:
       │        - Admin ID
       │        - Timestamp
       │        - Status verifikasi
       │        - Skor verifikasi
       │        - Alasan penolakan (jika ada)
       │        - Detail per kategori
       │
       └─► publish_event
            │
            ▼
┌──────────────────────────────────────────┐
│  STATUS: ADMIN_VERIFIED                   │
│  OUTPUT: verification_score, verified     │
└──────────────────────────────────────────┘
       │
       │ 4. Jika ADMIN_VERIFIED, lanjut ke Supervisor Approval
       │
       ▼
┌──────────────────────────────────────────┐
│  EVENT: AdminVerificationCompleted        │
└──────────────────────────────────────────┘
       │
       ▼
╔═══════════════════════════════════════════════════════════════╗
║  WORKFLOW 4: SUPERVISOR APPROVAL (wf_supervisor_approval)    ║
╚═══════════════════════════════════════════════════════════════╝
       │
       ├─► send_approval_request
       │    └─► Kirim notifikasi ke Dosen Pembimbing
       │        - Email/Notification
       │        - Link ke approval dashboard
       │        - Detail mahasiswa dan verifikasi admin
       │
       ├─► wait_supervisor_response
       │    └─► Tunggu respons dari supervisor
       │        - APPROVED
       │        - REJECTED + alasan
       │
       ├─► run_starlark_supervisor_approval
       │    └─► supervisor_approval.star: execute_supervisor_approval()
       │        ├─► verify_supervisor_authority()
       │        │   └─► Cek: supervisor_id == assigned_supervisor
       │        │       - Jika match: authorized = true
       │        │       - Jika tidak: authorized = false
       │        │
       │        ├─► validate_supervisor_decision()
       │        │   └─► Cek business rules:
       │        │       - Admin verification must pass: ✓
       │        │       - Decision is valid (APPROVED/REJECTED): ✓
       │        │       - No duplicate decisions: ✓
       │        │
       │        ├─► calculate_supervisor_approval_score()
       │        │   └─► Total Score: 0-130
       │        │       - Admin verification score: 0-100
       │        │       - Document quality: 0-10
       │        │       - Academic readiness: 0-10
       │        │       - Administrative compliance: 0-10
       │        │
       │        │       Recommendation:
       │        │       - >= 120: STRONG_APPROVE
       │        │       - >= 100: APPROVE
       │        │       - >= 85: APPROVE_WITH_CONDITIONS
       │        │       - >= 70: REVIEW_REQUIRED
       │        │       - < 70: REJECT
       │        │
       │        └─► process_supervisor_approval()
       │            └─► Final Decision:
       │                - APPROVED → SUPERVISOR_APPROVED
       │                - REJECTED → REJECTED
       │
       ├─► apply_vrule_supervisor_approval
       │    └─► vrule_supervisor_approval.yaml
       │        - Condition:
       │            * admin_verification_status: ADMIN_VERIFIED
       │            * supervisor_decision: APPROVED
       │            * supervisor_has_authority: true
       │        - Logic: AND
       │        - if_true: SUPERVISOR_APPROVED
       │        - if_false: REJECTED
       │
       ├─► save_decision
       ├─► audit_log (DETACH)
       │    └─► Catat:
       │        - Supervisor ID
       │        - Timestamp
       │        - Status approval
       │        - Skor komprehensif
       │        - Keputusan (APPROVED/REJECTED)
       │        - Alasan penolakan (jika ada)
       │        - Warnings
       │        - Authority check details
       │
       └─► publish_event
            │
            ▼
┌──────────────────────────────────────────┐
│  STATUS: SUPERVISOR_APPROVED              │
│  OUTPUT: approval_id, approved            │
└──────────────────────────────────────────┘
       │
       │ 5. Jika SUPERVISOR_APPROVED, lanjut ke Company Placement
       │
       ▼
┌──────────────────────────────────────────┐
│  EVENT: SupervisorDecision                │
└──────────────────────────────────────────┘
       │
       ▼
╔═══════════════════════════════════════════════════════════════╗
║  WORKFLOW 5: COMPANY PLACEMENT ENGINE (wf_placement)         ║
╚═══════════════════════════════════════════════════════════════╝
       │
       ├─► fetch_company_list
       │    └─► Ambil daftar perusahaan dari database
       │        - Filter: industri yang sesuai
       │        - Filter: kuota tersedia
       │        - Filter: lokasi
       │
       ├─► run_starlark_matching
       │    └─► company_matching.star
       │        - Algoritma matching berdasarkan:
       │          * Bidang keahlian mahasiswa
       │          * Preferensi mahasiswa
       │          * Kebutuhan perusahaan
       │          * Jarak lokasi
       │          * Kapasitas perusahaan
       │
       ├─► apply_vrule_company_matching
       │    └─► Validasi:
       │        - Kecocokan profil minimal 70%
       │        - Kuota perusahaan tersedia
       │        - Bidang sesuai
       │
       ├─► assign_company
       │    └─► Assign mahasiswa ke perusahaan terbaik match
       │
       └─► publish_event
            │
            ▼
┌──────────────────────────────────────────┐
│  STATUS: COMPANY_ASSIGNED                 │
│  OUTPUT: company_id, company_name         │
└──────────────────────────────────────────┘
       │
       │ 6. Mahasiswa mulai magang, submit progress mingguan
       │
       ▼
┌──────────────────────────────────────────┐
│  EVENT: ProgressSubmitted                 │
└──────────────────────────────────────────┘
       │
       ▼
╔═══════════════════════════════════════════════════════════════╗
║  WORKFLOW 6: WEEKLY PROGRESS MONITORING (wf_monitoring)       ║
╚═══════════════════════════════════════════════════════════════╝
       │
       ├─► validate_report
       │    └─► Cek kelengkapan laporan
       │        - Deskripsi aktivitas
       │        - Jam kerja
       │        - Tantangan
       │        - Hasil pembelajaran
       │
       ├─► apply_vrule_progress_compliance
       │    └─► Validasi:
       │        - Minimal 40 jam/minggu
       │        - Minimal 200 kata
       │        - Semua field terisi
       │
       ├─► save_progress
       ├─► audit_log (DETACH)
       └─► publish_event
            │
            ▼
┌──────────────────────────────────────────┐
│  STATUS: PROGRESS_VALIDATED               │
│  OUTPUT: progress_id, compliance_score    │
└──────────────────────────────────────────┘
       │
       │ 7. Berulang setiap minggu selama magang
       │    (Week 1, 2, 3, ... hingga selesai)
       │
       ▼
┌──────────────────────────────────────────┐
│  EVENT: EvaluationRequested               │
└──────────────────────────────────────────┘
       │
       ▼
╔═══════════════════════════════════════════════════════════════╗
║  WORKFLOW 7: PERFORMANCE EVALUATION (wf_evaluation)           ║
╚═══════════════════════════════════════════════════════════════╝
       │
       ├─► collect_all_data
       │    └─► Kumpulkan:
       │        - Semua progress reports
       │        - Supervisor feedback
       │        - Company evaluation
       │        - Attendance data
       │
       ├─► run_starlark_grading
       │    └─► performance_grading.star
       │        - Hitung skor akhir:
       │          * Progress completion: 30%
       │          * Supervisor rating: 30%
       │          * Company evaluation: 25%
       │          * Attendance: 15%
       │
       ├─► apply_vrule_performance_grading
       │    └─► Grading:
       │        - 90-100: A (Excellent)
       │        - 80-89: B (Good)
       │        - 70-79: C (Satisfactory)
       │        - 60-69: D (Needs Improvement)
       │        - < 60: E (Unsatisfactory)
       │
       ├─► save_result
       └─► publish_event
            │
            ▼
┌──────────────────────────────────────────┐
│  STATUS: EVALUATED                        │
│  OUTPUT: final_grade, score               │
└──────────────────────────────────────────┘
       │
       │ 8. Jika lulus (grade >= D), lanjut ke Certification
       │
       ▼
┌──────────────────────────────────────────┐
│  EVENT: EvaluationCompleted               │
└──────────────────────────────────────────┘
       │
       ▼
╔═══════════════════════════════════════════════════════════════╗
║  WORKFLOW 8: CERTIFICATION & COMPLETION (wf_certification)    ║
╚═══════════════════════════════════════════════════════════════╝
       │
       ├─► verify_final_score
       │    └─► Cek: score >= 60 (minimal lulus)
       │
       ├─► apply_vrule_certificate_release
       │    └─► Validasi:
       │        - Semua progress submitted
       │        - Evaluation completed
       │        - Score >= 60
       │
       ├─► generate_certificate
       │    └─► certificate.star
       │        - Generate sertifikat dengan template
       │        - Include: nama, perusahaan, periode, grade
       │        - Generate certificate number unik
       │
       ├─► save_certificate
       ├─► audit_log (DETACH)
       └─► publish_event
            │
            ▼
┌──────────────────────────────────────────┐
│  STATUS: COMPLETED                        │
│  OUTPUT: certificate_id, certificate_url  │
└──────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  EVENT: InternshipCompleted               │
└──────────────────────────────────────────┘
       │
       ▼
    [SELESAI] ✅


═══════════════════════════════════════════════════════════════════════════════
                           REJECTION FLOWS (GAGAL)
═══════════════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────────────────┐
│ REJECTION POINT 1: Eligibility Assessment                                │
└──────────────────────────────────────────────────────────────────────────┘

[EligibilityRequested]
       │
       ▼
╔═══════════════════════════════════════════════════════════════╗
║  WORKFLOW 2: ELIGIBILITY ASSESSMENT                           ║
╚═══════════════════════════════════════════════════════════════╝
       │
       ├─► GPA < 3.0 ATAU Semester < 5
       │
       ▼
┌──────────────────────────────────────────┐
│  STATUS: NOT_ELIGIBLE                     │
└──────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  EVENT: EligibilityRejected               │
└──────────────────────────────────────────┘
       │
       ▼
    [STOP - REJECTED] ❌
    Alasan: Tidak memenuhi kriteria akademik minimal


┌──────────────────────────────────────────────────────────────────────────┐
│ REJECTION POINT 2: Admin Verification                                    │
└──────────────────────────────────────────────────────────────────────────┘

[EligibilityCompleted]
       │
       ▼
╔═══════════════════════════════════════════════════════════════╗
║  WORKFLOW 3: ADMIN VERIFICATION                               ║
╚═══════════════════════════════════════════════════════════════╝
       │
       ├─► Document tidak lengkap
       │   - KRS missing
       │   - Transkrip missing
       │   - Surat pengantar missing
       │   - CV missing
       │   - Portfolio missing
       │
       ├─► Data akademik tidak valid
       │   - GPA mismatch dengan eligibility
       │   - Semester mismatch
       │   - Student tidak ACTIVE
       │
       ├─► Persyaratan administrasi tidak terpenuhi
       │   - Pembayaran belum lunas
       │   - Surat bebas tanggungan tidak ada
       │   - Registrasi tidak valid
       │
       ▼
┌──────────────────────────────────────────┐
│  STATUS: REJECTED                         │
│  rejection_reasons:                       │
│  - INCOMPLETE_DOCUMENT                    │
│  - INVALID_ACADEMIC_DATA                  │
│  - ADMINISTRATIVE_REQUIREMENTS_NOT_MET    │
│  - NOT_ELIGIBLE                           │
└──────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  EVENT: AdminVerificationRejected         │
└──────────────────────────────────────────┘
       │
       ▼
    [STOP - REJECTED] ❌
    Alasan: Gagal verifikasi admin


┌──────────────────────────────────────────────────────────────────────────┐
│ REJECTION POINT 3: Supervisor Approval                                   │
└──────────────────────────────────────────────────────────────────────────┘

[AdminVerificationCompleted]
       │
       ▼
╔═══════════════════════════════════════════════════════════════╗
║  WORKFLOW 4: SUPERVISOR APPROVAL                              ║
╚═══════════════════════════════════════════════════════════════╝
       │
       ├─► Supervisor tidak berwenang
       │   - Supervisor bukan Dosen Pembimbing mahasiswa
       │
       ├─► Supervisor menolak
       │   - Decision: REJECTED
       │   - Alasan: Kurang memadai, dll
       │
       ├─► Decision duplikat
       │   - Supervisor sudah pernah approve/reject
       │
       ▼
┌──────────────────────────────────────────┐
│  STATUS: REJECTED                         │
│  rejection_reasons:                       │
│  - SUPERVISOR_NOT_AUTHORIZED              │
│  - SUPERVISOR_REJECTED                    │
│  - INVALID_DECISION                       │
└──────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  EVENT: SupervisorDecisionRejected        │
└──────────────────────────────────────────┘
       │
       ▼
    [STOP - REJECTED] ❌
    Alasan: Gagal approval supervisor


═══════════════════════════════════════════════════════════════════════════════
                         EVENT FLOW SUMMARY
═══════════════════════════════════════════════════════════════════════════════

SUCCESS FLOW:
─────────────
InternshipSubmitted
    ↓
EligibilityRequested
    ↓
EligibilityCompleted
    ↓
AdminVerificationCompleted
    ↓
SupervisorDecision
    ↓
CompanyAssigned
    ↓
ProgressSubmitted (berulang)
    ↓
ProgressUpdated (berulang)
    ↓
EvaluationRequested
    ↓
EvaluationCompleted
    ↓
InternshipCompleted ✅

REJECTION FLOWS:
────────────────
1. InternshipSubmitted → EligibilityRequested → EligibilityRejected ❌

2. InternshipSubmitted → EligibilityRequested → EligibilityCompleted 
   → AdminVerificationRejected ❌

3. InternshipSubmitted → EligibilityRequested → EligibilityCompleted 
   → AdminVerificationCompleted → SupervisorDecisionRejected ❌


═══════════════════════════════════════════════════════════════════════════════
                      STATUS TRANSITION MATRIX
═══════════════════════════════════════════════════════════════════════════════

INITIAL STATE
    │
    ▼
REGISTERED (Workflow 1 complete)
    │
    ▼
ELIGIBILITY_DONE (Workflow 2 complete)
    │
    ├─► ELIGIBLE → ADMIN_VERIFIED (Workflow 3 complete)
    │                   │
    │                   ▼
    │           SUPERVISOR_APPROVED (Workflow 4 complete)
    │                   │
    │                   ▼
    │           COMPANY_ASSIGNED (Workflow 5 complete)
    │                   │
    │                   ▼
    │           PROGRESS_VALIDATED (Workflow 6 - repeated)
    │                   │
    │                   ▼
    │           EVALUATED (Workflow 7 complete)
    │                   │
    │                   ▼
    │           COMPLETED (Workflow 8 complete) ✅
    │
    └─► NOT_ELIGIBLE → REJECTED ❌

ADMIN_VERIFIED
    │
    ├─► APPROVED → SUPERVISOR_APPROVED
    │
    └─► REJECTED → REJECTED ❌

SUPERVISOR_APPROVED
    │
    ├─► APPROVED → COMPANY_ASSIGNED
    │
    └─► REJECTED → REJECTED ❌


═══════════════════════════════════════════════════════════════════════════════
                         COMPONENT INTERACTION
═══════════════════════════════════════════════════════════════════════════════

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │      │   Backend    │      │   Database   │
│   (React)    │      │   (Node.js)  │      │  (SQLite/    │
│              │      │              │      │  PostgreSQL) │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │  HTTP Request       │                     │
       │────────────────────>│                     │
       │                     │                     │
       │                     │  Query/Insert       │
       │                     │────────────────────>│
       │                     │                     │
       │                     │  Data Response      │
       │                     │<────────────────────│
       │                     │                     │
       │  HTTP Response      │                     │
       │<────────────────────│                     │
       │                     │                     │
       └─────────────────────┴─────────────────────┘

                              │
                              │ Publish Event
                              ▼
                    ┌──────────────────┐
                    │  NATS Event Bus  │
                    │  (Pub/Sub)       │
                    └────────┬─────────┘
                             │
                             │ Subscribe
                             ▼
                    ┌──────────────────┐
                    │  VFlow Engine    │
                    │  (Workflow)      │
                    └────────┬─────────┘
                             │
                             │ Execute
                             ▼
                    ┌──────────────────┐
                    │  Starlark Engine │
                    │  (Business Logic)│
                    └────────┬─────────┘
                             │
                             │ Evaluate
                             ▼
                    ┌──────────────────┐
                    │  VRule Engine    │
                    │  (Validation)    │
                    └────────┬─────────┘
                             │
                             │ Async Log
                             ▼
                    ┌──────────────────┐
                    │  Audit Service   │
                    │  (Detach Activity)│
                    └──────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                         KEY DECISION POINTS
═══════════════════════════════════════════════════════════════════════════════

1. ELIGIBILITY CHECK
   ├─► GPA >= 3.0 AND Semester >= 5
   └─► Result: ELIGIBLE atau NOT_ELIGIBLE

2. ADMIN VERIFICATION
   ├─► Document Complete?
   ├─► Academic Data Valid?
   ├─► Administrative Requirements Met?
   └─► Result: ADMIN_VERIFIED atau REJECTED

3. SUPERVISOR APPROVAL
   ├─► Supervisor Authorized?
   ├─► Admin Verification Passed?
   └─► Result: SUPERVISOR_APPROVED atau REJECTED

4. COMPANY PLACEMENT
   ├─► Company Available?
   ├─► Match Score >= 70%?
   └─► Result: COMPANY_ASSIGNED

5. PERFORMANCE EVALUATION
   ├─► All Progress Submitted?
   ├─► Score >= 60?
   └─► Result: EVALUATED (A/B/C/D/E)

6. CERTIFICATION
   ├─► Evaluation Passed?
   └─► Result: COMPLETED dengan sertifikat


═══════════════════════════════════════════════════════════════════════════════
                         DATA FLOW EXAMPLE
═══════════════════════════════════════════════════════════════════════════════

Contoh: Mahasiswa "Ahmad" mendaftar magang

1. InternshipSubmitted
   {
     "student_id": "STU001",
     "student_name": "Ahmad",
     "gpa": 3.5,
     "semester": 6,
     "documents": {...}
   }

2. EligibilityRequested → EligibilityCompleted
   {
     "internship_id": "INT001",
     "eligibility_score": 85,
     "eligible": true,
     "status": "ELIGIBLE"
   }

3. AdminVerificationCompleted
   {
     "verification_id": "VER001",
     "verification_score": 92,
     "document_status": "COMPLETE",
     "academic_status": "VALID",
     "administrative_status": "MET",
     "status": "ADMIN_VERIFIED"
   }

4. SupervisorDecision
   {
     "approval_id": "APP001",
     "supervisor_id": "DOS001",
     "decision": "APPROVED",
     "score_analysis": {
       "total_score": 118,
       "percentage": 90.8
     },
     "status": "SUPERVISOR_APPROVED"
   }

5. CompanyAssigned
   {
     "placement_id": "PLC001",
     "company_id": "COM001",
     "company_name": "PT. Teknologi Indonesia",
     "status": "COMPANY_ASSIGNED"
   }

6. ProgressUpdated (x12 minggu)
   {
     "progress_id": "PRG001-PRG012",
     "week_number": 1-12,
     "compliance_score": 95,
     "status": "PROGRESS_VALIDATED"
   }

7. EvaluationCompleted
   {
     "evaluation_id": "EVA001",
     "final_grade": "A",
     "score": 92,
     "status": "EVALUATED"
   }

8. InternshipCompleted
   {
     "certificate_id": "CERT001",
     "certificate_number": "CERT-2026-001",
     "final_grade": "A",
     "status": "COMPLETED"
   }

✅ PROSES SELESAI


═══════════════════════════════════════════════════════════════════════════════
                         TIMELINE ESTIMATION
═══════════════════════════════════════════════════════════════════════════════

Week 0:
  - Day 1:   Mahasiswa submit pendaftaran
  - Day 1:   Workflow 1 (Registration) - INSTANT
  - Day 1:   Workflow 2 (Eligibility) - INSTANT
  - Day 1-3: Workflow 3 (Admin Verification) - 1-3 hari
  - Day 3-7: Workflow 4 (Supervisor Approval) - 3-7 hari
  - Day 7:   Workflow 5 (Company Placement) - INSTANT

Week 1-12:
  - Weekly:  Workflow 6 (Progress Monitoring) - Setiap minggu

Week 13:
  - Day 1:   Workflow 7 (Performance Evaluation) - 1-3 hari
  - Day 3:   Workflow 8 (Certification) - INSTANT

TOTAL: ~12-14 weeks (3-4 months)

FAST TRACK (jika semua approve cepat):
  - Registration: 1 day
  - Eligibility: 1 day
  - Admin Verification: 1 day
  - Supervisor Approval: 1 day
  - Company Placement: 1 day
  - Internship: 12 weeks
  - Evaluation: 1 day
  - Certification: 1 day
  TOTAL: ~14 weeks

SLOW TRACK (jika ada revisi):
  - Registration: 1 day
  - Eligibility: 1 day
  - Admin Verification: 3-7 days (ada revisi dokumen)
  - Supervisor Approval: 7-14 days (supervisor sibuk)
  - Company Placement: 3-5 days (matching process)
  - Internship: 12-16 weeks
  - Evaluation: 3-5 days
  - Certification: 1 day
  TOTAL: ~16-20 weeks


═══════════════════════════════════════════════════════════════════════════════
                         STAKEHOLDER RESPONSIBILITIES
═══════════════════════════════════════════════════════════════════════════════

MAHASISWA (Student):
  ✓ Submit pendaftaran dengan dokumen lengkap
  ✓ Submit laporan kemajuan mingguan
  ✓ Mengikuti evaluasi akhir
  ✓ Menerima sertifikat

ADMIN:
  ✓ Verifikasi dokumen mahasiswa (Workflow 3)
  ✓ Validasi data akademik
  ✓ Cek persyaratan administrasi
  ✓ Approval/Rejection dengan alasan jelas

DOSEN PEMBIMBING (Supervisor):
  ✓ Review hasil verifikasi admin
  ✓ Approval/Rejection mahasiswa (Workflow 4)
  ✓ Provide feedback selama magang
  ✓ Isi evaluasi kinerja akhir

PERUSAHAAN (Company):
  ✓ Provide lowongan magang
  ✓ Provide evaluasi kinerja mahasiswa
  ✓ Provide feedback mingguan

SYSTEM:
  ✓ Automated eligibility checking
  ✓ Automated document verification
  ✓ Automated company matching
  ✓ Automated progress tracking
  ✓ Automated grading
  ✓ Automated certificate generation
  ✓ Complete audit trail