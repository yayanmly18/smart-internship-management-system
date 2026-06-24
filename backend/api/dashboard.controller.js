const express = require('express');
const router = express.Router();
const db = require('../integrations/database.client');
const authMiddleware = require('../middleware/auth.middleware');

// ================================================================
// MAHASISWA DASHBOARD - Stats & Progress
// ================================================================
router.get('/mahasiswa/dashboard', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'mahasiswa') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const userId = req.user.id;
    const user = await db.get(
      'SELECT id, name, nim, email, prodi, year, phone FROM users WHERE id = ?',
      [userId]
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get latest internship
    const internship = await db.get(
      `SELECT id, status, progress, company, pembimbing_email, created_at
       FROM internships WHERE user_email = ? ORDER BY created_at DESC LIMIT 1`,
      [user.email]
    );

    // Get report count
    const reportCount = internship ? await db.get(
      'SELECT COUNT(*) as count FROM reports WHERE internship_id = ?',
      [internship.id]
    ) : { count: 0 };

    // Get latest feedback scores
    const feedbacks = internship ? await db.all(
      `SELECT f.score, f.comment, f.created_at
       FROM feedbacks f WHERE f.student_id = ?
       ORDER BY f.created_at DESC`,
      [user.nim || String(user.id)]
    ) : [];

    const avgScore = feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + (f.score || 0), 0) / feedbacks.length).toFixed(1)
      : null;

    // Weekly report data (generate from actual reports)
    const weeklyReports = await db.all(
      `SELECT week, created_at FROM reports WHERE internship_id = ?
       ORDER BY week ASC LIMIT 8`,
      [internship ? internship.id : null]
    );

    const weeklyData = [];
    for (let w = 1; w <= 8; w++) {
      const found = weeklyReports.find(r => r.week === w);
      weeklyData.push({
        week: `W${w}`,
        laporan: found ? 1 : 0,
        kehadiran: found ? 5 : 0,
      });
    }

    // Timeline / activity log
    const timeline = [];
    if (internship) {
      timeline.push({
        date: internship.created_at ? new Date(internship.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
        title: 'Pendaftaran Magang',
        type: 'upload'
      });

      // Add report uploads to timeline
      for (const r of weeklyReports.slice(0, 5)) {
        timeline.push({
          date: new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          title: `Laporan Minggu ${r.week} Diunggah`,
          type: 'upload'
        });
      }

      // Add feedbacks to timeline
      for (const f of feedbacks.slice(0, 3)) {
        timeline.push({
          date: new Date(f.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          title: `Feedback Diterima${f.score ? ` (Nilai: ${f.score})` : ''}`,
          type: 'feedback'
        });
      }
    }

    const totalWeeks = 8;
    const completedWeeks = weeklyReports.length;
    const progressPct = internship?.progress ?? Math.round((completedWeeks / totalWeeks) * 100);

    res.json({
      success: true,
      data: {
        user: {
          name: user.name,
          nim: user.nim,
          prodi: user.prodi,
          year: user.year,
        },
        internship: internship ? {
          id: internship.id,
          status: internship.status || 'pending',
          progress: progressPct,
          company: internship.company || '-',
          pembimbing_email: internship.pembimbing_email || '-',
        } : null,
        stats: {
          progress: progressPct,
          laporanDikirim: `${reportCount.count}/${totalWeeks}`,
          avgScore: avgScore || '-',
          remainingDays: '-',
        },
        weeklyData,
        timeline,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get dashboard' });
  }
});

// ================================================================
// MAHASISWA STATUS - Detail Status & Stages
// ================================================================
router.get('/mahasiswa/status', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'mahasiswa') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const userId = req.user.id;
    const user = await db.get(
      'SELECT id, name, nim, email, prodi, year FROM users WHERE id = ?',
      [userId]
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const internship = await db.get(
      `SELECT id, status, progress, company, pembimbing_email, motivation, created_at
       FROM internships WHERE user_email = ? ORDER BY created_at DESC LIMIT 1`,
      [user.email]
    );

    let pembimbingInfo = null;
    if (internship?.pembimbing_email) {
      pembimbingInfo = await db.get(
        'SELECT name, nip, email FROM users WHERE email = ? AND role = ?',
        [internship.pembimbing_email, 'pembimbing']
      );
    }

    const stages = [
      {
        label: 'Pendaftaran Dikirim',
        date: internship?.created_at ? new Date(internship.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
        desc: 'Berkas pendaftaran berhasil dikirim dan sedang diproses admin.',
        done: !!internship
      },
      {
        label: 'Seleksi Berkas',
        date: internship?.status && (internship.status !== 'pending' && internship.status !== 'ditolak') ? new Date(internship.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
        desc: 'Berkas Anda sedang dalam proses seleksi administrasi.',
        done: internship?.status && internship.status !== 'pending' && internship.status !== 'ditolak'
      },
      {
        label: 'Persetujuan Pembimbing',
        date: internship?.pembimbing_email ? new Date(internship.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
        desc: internship?.pembimbing_email
          ? `${pembimbingInfo?.name || internship.pembimbing_email} menyetujui Anda sebagai mahasiswa bimbingan.`
          : 'Menunggu penugasan pembimbing oleh admin.',
        done: !!internship?.pembimbing_email
      },
      {
        label: 'Penempatan Perusahaan',
        date: internship?.company && internship.company !== '-' ? new Date(internship.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
        desc: internship?.company && internship.company !== '-'
          ? `Ditempatkan di ${internship.company}.`
          : 'Menunggu penempatan perusahaan.',
        done: !!(internship?.company && internship.company !== '-')
      },
      {
        label: 'Evaluasi Akhir',
        date: internship?.status === 'selesai' ? new Date(internship.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
        desc: internship?.status === 'selesai'
          ? 'Evaluasi akhir telah dilaksanakan.'
          : 'Evaluasi akhir dilaksanakan pada akhir periode magang.',
        done: internship?.status === 'selesai'
      },
      {
        label: 'Penerbitan Sertifikat',
        date: internship?.status === 'selesai' ? new Date(internship.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
        desc: internship?.status === 'selesai'
          ? 'Sertifikat digital telah diterbitkan.'
          : 'Sertifikat digital diterbitkan setelah evaluasi akhir.',
        done: internship?.status === 'selesai'
      },
    ];

    const doneCount = stages.filter(s => s.done).length;

    res.json({
      success: true,
      data: {
        internship: internship ? {
          id: internship.id,
          status: internship.status || 'pending',
          progress: internship.progress ?? 0,
          company: internship.company || '-',
        } : null,
        stages,
        stats: {
          stagesDone: `${doneCount}/${stages.length}`,
          progress: internship?.progress ?? 0,
        },
        placement: {
          company: internship?.company || '-',
          pembimbing: pembimbingInfo?.name || internship?.pembimbing_email || '-',
          pembimbingEmail: pembimbingInfo?.email || internship?.pembimbing_email || '-',
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get status' });
  }
});

// ================================================================
// MAHASISWA EVALUATION - Grades
// ================================================================
router.get('/mahasiswa/evaluation', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'mahasiswa') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const userId = req.user.id;
    const user = await db.get(
      'SELECT id, name, nim, email FROM users WHERE id = ?',
      [userId]
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const internship = await db.get(
      `SELECT id, status, progress, company
       FROM internships WHERE user_email = ? ORDER BY created_at DESC LIMIT 1`,
      [user.email]
    );

    const feedbacks = await db.all(
      `SELECT score, comment, created_at FROM feedbacks
       WHERE student_id = ? ORDER BY created_at DESC`,
      [user.nim || String(user.id)]
    );

    const avgFeedbackScore = feedbacks.length > 0
      ? Math.round(feedbacks.reduce((s, f) => s + (f.score || 0), 0) / feedbacks.length)
      : 0;

    const components = [
      {
        label: 'Kehadiran & Kedisiplinan',
        weight: 20,
        score: internship?.status === 'aktif' || internship?.status === 'selesai' ? 90 : 0,
        color: 'bg-emerald-500',
        textColor: 'text-emerald-700',
      },
      {
        label: 'Nilai Pembimbing Akademik',
        weight: 25,
        score: avgFeedbackScore || (internship?.status === 'selesai' ? 85 : 0),
        color: 'bg-blue-500',
        textColor: 'text-blue-700',
      },
      {
        label: 'Nilai Pembimbing Lapangan',
        weight: 35,
        score: avgFeedbackScore || (internship?.status === 'selesai' ? 88 : 0),
        color: 'bg-violet-500',
        textColor: 'text-violet-700',
      },
      {
        label: 'Kualitas Laporan',
        weight: 20,
        score: avgFeedbackScore || (internship?.status === 'selesai' ? 82 : 0),
        color: 'bg-amber-500',
        textColor: 'text-amber-700',
      },
    ];

    const totalWeight = components.reduce((s, c) => s + c.weight, 0);
    const weightedScore = totalWeight > 0
      ? Math.round(components.reduce((s, c) => s + (c.score * c.weight) / totalWeight, 0))
      : 0;

    let grade = '-';
    if (weightedScore >= 85) grade = 'A';
    else if (weightedScore >= 75) grade = 'B';
    else if (weightedScore >= 65) grade = 'C';
    else if (weightedScore >= 50) grade = 'D';
    else grade = 'E';

    const predikat = weightedScore >= 85 ? 'Sangat Memuaskan'
      : weightedScore >= 75 ? 'Memuaskan'
      : weightedScore >= 65 ? 'Cukup'
      : weightedScore >= 50 ? 'Kurang'
      : 'Tidak Lulus';

    res.json({
      success: true,
      data: {
        finalScore: weightedScore,
        grade,
        predikat,
        components,
        feedbacks: feedbacks.slice(0, 10),
        internship: internship ? {
          status: internship.status,
          company: internship.company,
        } : null,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get evaluation' });
  }
});

// ================================================================
// MAHASISWA CERTIFICATE - Data
// ================================================================
router.get('/mahasiswa/certificate', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'mahasiswa') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const userId = req.user.id;
    const user = await db.get(
      'SELECT id, name, nim, email, prodi, year FROM users WHERE id = ?',
      [userId]
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const internship = await db.get(
      `SELECT id, status, progress, company, created_at
       FROM internships WHERE user_email = ? ORDER BY created_at DESC LIMIT 1`,
      [user.email]
    );

    const reportCount = internship ? await db.get(
      'SELECT COUNT(*) as count FROM reports WHERE internship_id = ?',
      [internship.id]
    ) : { count: 0 };

    const requirements = [
      { label: 'Kehadiran minimal 80%', ok: internship?.status === 'aktif' || internship?.status === 'selesai', value: internship?.status === 'selesai' ? '100% ✓' : 'Menunggu' },
      { label: 'Semua laporan mingguan dikirim', ok: (reportCount.count || 0) >= 6, value: `${reportCount.count}/8 laporan` },
      { label: 'Evaluasi pembimbing selesai', ok: internship?.status === 'selesai', value: internship?.status === 'selesai' ? 'Selesai ✓' : 'Belum' },
      { label: 'Nilai akhir minimal 70', ok: internship?.status === 'selesai', value: internship?.status === 'selesai' ? 'Tercapai ✓' : 'Menunggu' },
      { label: 'Laporan akhir diserahkan', ok: (reportCount.count || 0) >= 8, value: (reportCount.count || 0) >= 8 ? 'Ya ✓' : 'Belum' },
    ];

    const allMet = requirements.every(r => r.ok);
    const progressPct = requirements.filter(r => r.ok).length / requirements.length * 100;

    res.json({
      success: true,
      data: {
        user: {
          name: user.name,
          nim: user.nim,
          prodi: user.prodi,
        },
        internship: internship ? {
          company: internship.company || '-',
          status: internship.status || 'pending',
          startDate: internship.created_at ? new Date(internship.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
        } : null,
        isAvailable: internship?.status === 'selesai',
        requirements,
        progressPct: Math.round(progressPct),
        allMet,
        certificateCode: internship && internship.status === 'selesai'
          ? `CERT-UTI-2026-${user.nim || user.id}`
          : null,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get certificate data' });
  }
});

// ================================================================
// PEMBIMBING - Pending feedback & student reports
// ================================================================
router.get('/pembimbing/pending-feedback', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'pembimbing') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const userId = req.user.id;
    const pembimbing = await db.get(
      'SELECT email, name FROM users WHERE id = ? AND role = ?',
      [userId, 'pembimbing']
    );
    if (!pembimbing?.email) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const students = await db.all(
      `SELECT i.id as internshipId, i.user_email, i.status, i.progress, i.nim,
              us.name as studentName, us.nim as studentNim
       FROM internships i
       LEFT JOIN users us ON us.email = i.user_email
       WHERE i.pembimbing_email = ?
       ORDER BY i.created_at DESC`,
      [pembimbing.email]
    );

    const pendingFeedback = [];
    const totalWeeks = 8;

    for (const s of students) {
      // Ambil semua report per minggu untuk internship ini
      const reports = await db.all(
        `SELECT r.id, r.week, r.note, r.file_path, r.created_at
         FROM reports r WHERE r.internship_id = ?
         ORDER BY r.week ASC`,
        [s.internshipId]
      );

      const reportByWeek = new Map(reports.map(r => [Number(r.week), r]));

      // Ambil semua feedback untuk student ini pada internship ini
      const feedbacks = await db.all(
        `SELECT f.id, f.score, f.comment, f.created_at
         FROM feedbacks f
         WHERE f.student_id = ? AND f.internship_id = ?
         ORDER BY f.created_at DESC`,
        [s.studentNim || String(s.user_email), s.internshipId]
      );

      // Index feedback per minggu berdasarkan format komentar: "... (Minggu X)"
      const feedbackByWeek = new Map();
      for (const f of feedbacks) {
        const match = (f.comment || '').match(/\(Minggu (\d+)\)/);
        if (match) {
          const w = Number(match[1]);
          if (!feedbackByWeek.has(w)) {
            feedbackByWeek.set(w, f); // feedback terbaru untuk minggu tersebut
          }
        }
      }

      // Buat slot minggu 1..8 untuk monitoring/persentase yang konsisten
      for (let w = 1; w <= totalWeeks; w++) {
        const r = reportByWeek.get(w);
        const f = feedbackByWeek.get(w);

        pendingFeedback.push({
          internshipId: s.internshipId,
          studentId: s.studentNim || s.user_email,
          studentName: s.studentName || '-',
          week: w,
          hasReport: !!r,
          date: r?.created_at
            ? new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            : null,
          excerpt: r?.note ? r.note.substring(0, 200) : (r ? 'Laporan mingguan' : 'Belum mengirim laporan'),
          fileName: r?.file_path ? require('path').basename(r.file_path) : null,
          hasFeedback: !!f,
          existingScore: f?.score ?? null,
          existingComment: f?.comment ? f.comment.replace(/\s*\(Minggu \d+\)\s*$/, '') : null,
        });
      }
    }


    res.json({
      success: true,
      data: { pendingFeedback }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get pending feedback' });
  }
});

// ================================================================
// PEMBIMBING - Send feedback for a specific report
// ================================================================
router.post('/pembimbing/send-feedback', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'pembimbing') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { studentId, internshipId, week, score, comment } = req.body;
    if (!studentId || score === undefined || score === null) {
      return res.status(400).json({ success: false, message: 'studentId dan score diperlukan' });
    }

    // Save feedback with week reference in comment
    const feedbackComment = comment 
      ? `${comment} (Minggu ${week || '?'})`
      : `Feedback untuk laporan minggu ${week || '?'}`;

    const result = await db.run(
      'INSERT INTO feedbacks (student_id, internship_id, score, comment) VALUES (?,?,?,?)',
      [String(studentId), internshipId || null, Number(score), feedbackComment]
    );

    res.json({
      success: true,
      message: `Feedback untuk minggu ${week || ''} berhasil dikirim`,
      data: { id: result.id, studentId, score, week }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================================================================
// MAHASISWA - Get feedback on reports
// ================================================================
router.get('/mahasiswa/feedbacks', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'mahasiswa') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const user = await db.get('SELECT id, nim, email FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    const internship = await db.get(
      'SELECT id FROM internships WHERE user_email = ? ORDER BY created_at DESC LIMIT 1',
      [user.email]
    );

    if (!internship) {
      return res.json({ success: true, data: { feedbacks: [] } });
    }

    const feedbacks = await db.all(
      `SELECT f.id, f.score, f.comment, f.created_at
       FROM feedbacks f WHERE f.student_id = ? OR f.internship_id = ?
       ORDER BY f.created_at DESC`,
      [user.nim || String(user.id), internship.id]
    );

    // Parse week from comment if present
    const mapped = feedbacks.map(f => {
      let week = null;
      let cleanComment = f.comment || '';
      const weekMatch = cleanComment.match(/\(Minggu (\d+)\)/);
      if (weekMatch) {
        week = parseInt(weekMatch[1]);
        cleanComment = cleanComment.replace(/\(Minggu \d+\)/, '').trim();
      }
      return {
        id: f.id,
        score: f.score,
        comment: cleanComment,
        week,
        createdAt: f.created_at,
      };
    });

    res.json({
      success: true,
      data: { feedbacks: mapped }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================================================================
// PEMBIMBING SCHEDULE
// ================================================================
router.get('/pembimbing/schedule', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'pembimbing') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const userId = req.user.id;
    const pembimbing = await db.get(
      'SELECT email, name FROM users WHERE id = ? AND role = ?',
      [userId, 'pembimbing']
    );
    if (!pembimbing?.email) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const students = await db.all(
      `SELECT i.id as internshipId, i.user_email, i.status, i.progress, i.company,
              us.name as studentName, us.nim as studentNim
       FROM internships i
       LEFT JOIN users us ON us.email = i.user_email
       WHERE i.pembimbing_email = ?
       ORDER BY i.created_at DESC`,
      [pembimbing.email]
    );

    const schedules = [];
    for (const s of students) {
      if (s.status === 'aktif' || s.status === 'pending') {
        schedules.push({
          id: s.internshipId,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          time: '09.00–10.00',
          student: s.studentName || '-',
          type: 'Evaluasi Tengah',
          status: 'scheduled',
          place: 'Ruang Bimbingan',
        });
      }
      if (s.status === 'selesai') {
        schedules.push({
          id: s.internshipId,
          date: new Date(Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          time: '09.00–10.00',
          student: s.studentName || '-',
          type: 'Sidang Sertifikat',
          status: 'done',
          place: 'Aula Utama',
        });
      }
    }

    res.json({
      success: true,
      data: { schedules }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get schedule' });
  }
});

// ================================================================
// MAHASISWA - Upload Weekly Report with File
// ================================================================
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.resolve(__dirname, '..', 'uploads', 'reports');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const reportStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `report_${uniqueSuffix}${ext}`);
  }
});

const uploadReportFile = multer({
  storage: reportStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipe file tidak diizinkan. Gunakan: PDF, DOCX, JPG, PNG, ZIP'));
    }
  }
}).single('report_file');

router.post('/mahasiswa/upload-report', authMiddleware, (req, res) => {
  uploadReportFile(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File terlalu besar. Maksimal 10MB.' });
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      if (!req.user || req.user.role !== 'mahasiswa') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const { week, note } = req.body;
      if (!week) {
        return res.status(400).json({ success: false, message: 'Minggu laporan (week) diperlukan' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File laporan harus diupload' });
      }

      const user = await db.get('SELECT id, email FROM users WHERE id = ?', [req.user.id]);
      if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

      const internship = await db.get(
        'SELECT id, status FROM internships WHERE user_email = ? ORDER BY created_at DESC LIMIT 1',
        [user.email]
      );
      if (!internship) return res.status(400).json({ success: false, message: 'Anda belum terdaftar magang' });

      const weekNum = Number(week);

      const existing = await db.get(
        'SELECT id FROM reports WHERE internship_id = ? AND week = ?',
        [internship.id, weekNum]
      );
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: `Laporan minggu ${weekNum} sudah pernah diupload. Tidak dapat mengupload lagi.` 
        });
      } else {
        await db.run(
          'INSERT INTO reports (internship_id, week, note, file_path) VALUES (?,?,?,?)',
          [internship.id, weekNum, note || null, req.file.path]
        );
      }

      const reportCount = await db.get(
        'SELECT COUNT(*) as count FROM reports WHERE internship_id = ?',
        [internship.id]
      );
      const newProgress = Math.min(100, Math.round(((reportCount?.count || 0) / 8) * 100));
      const newStatus = newProgress >= 100 ? 'selesai' : internship.status === 'aktif' || internship.status === 'selesai' ? internship.status : 'aktif';

      await db.run(
        'UPDATE internships SET progress = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newProgress, newStatus, internship.id]
      );

      const auditService = require('../services/audit.service');
      await auditService.log({
        action: 'WEEKLY_REPORT_UPLOADED',
        data: { internshipId: internship.id, week: weekNum, file: req.file.filename, progress: newProgress },
        internshipId: internship.id
      });

      res.json({
        success: true,
        message: `Laporan minggu ${weekNum} berhasil diupload`,
        data: {
          week: weekNum,
          progress: newProgress,
          status: newStatus,
          file: req.file.filename,
          totalReports: reportCount?.count || 0
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message || 'Gagal upload laporan' });
    }
  });
});

// GET /api/dashboard/mahasiswa/reports - Get student's report history with feedbacks
router.get('/mahasiswa/reports', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'mahasiswa') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const user = await db.get('SELECT id, email, nim FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    const internship = await db.get(
      'SELECT id, progress, status FROM internships WHERE user_email = ? ORDER BY created_at DESC LIMIT 1',
      [user.email]
    );
    if (!internship) {
      return res.json({ success: true, data: { reports: [], feedbacks: [], progress: 0, status: 'pending' } });
    }

    const reports = await db.all(
      'SELECT id, week, note, file_path, created_at FROM reports WHERE internship_id = ? ORDER BY week ASC',
      [internship.id]
    );

    // Get feedbacks for this student
    const feedbacks = await db.all(
      `SELECT f.id, f.score, f.comment, f.created_at
       FROM feedbacks f WHERE f.student_id = ? OR f.internship_id = ?
       ORDER BY f.created_at DESC`,
      [user.nim || String(user.id), internship.id]
    );

    // Map feedbacks with week info
    const mappedFeedbacks = feedbacks.map(f => {
      let week = null;
      let cleanComment = f.comment || '';
      const weekMatch = cleanComment.match(/\(Minggu (\d+)\)/);
      if (weekMatch) {
        week = parseInt(weekMatch[1]);
        cleanComment = cleanComment.replace(/\(Minggu \d+\)/, '').trim();
      }
      return {
        id: f.id,
        score: f.score,
        comment: cleanComment,
        week,
        createdAt: f.created_at,
      };
    });

    const mappedReports = reports.map(r => ({
      id: r.id,
      week: r.week,
      note: r.note,
      fileName: r.file_path ? path.basename(r.file_path) : null,
      uploadedAt: r.created_at,
      feedback: mappedFeedbacks.find(f => f.week === r.week) || null,
    }));

    res.json({
      success: true,
      data: {
        reports: mappedReports,
        feedbacks: mappedFeedbacks,
        progress: internship.progress || 0,
        status: internship.status || 'pending',
        totalReports: mappedReports.length,
        totalWeeks: 8,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;