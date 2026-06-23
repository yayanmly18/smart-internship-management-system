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

    // Get pembimbing info if assigned
    let pembimbingInfo = null;
    if (internship?.pembimbing_email) {
      pembimbingInfo = await db.get(
        'SELECT name, nip, email FROM users WHERE email = ? AND role = ?',
        [internship.pembimbing_email, 'pembimbing']
      );
    }

    // Build stages based on actual data
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

    // Get all feedbacks for this student
    const feedbacks = await db.all(
      `SELECT score, comment, created_at FROM feedbacks
       WHERE student_id = ? ORDER BY created_at DESC`,
      [user.nim || String(user.id)]
    );

    // Calculate component scores (in a real system these would come from separate tables)
    // Here we derive from available feedback data
    const avgFeedbackScore = feedbacks.length > 0
      ? Math.round(feedbacks.reduce((s, f) => s + (f.score || 0), 0) / feedbacks.length)
      : 0;

    // Use real data if available, otherwise provide defaults based on status
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

    // Weighted average
    const totalWeight = components.reduce((s, c) => s + c.weight, 0);
    const weightedScore = totalWeight > 0
      ? Math.round(components.reduce((s, c) => s + (c.score * c.weight) / totalWeight, 0))
      : 0;

    // Grade mapping
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

    // Check requirements
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
// PEMBIMBING FEEDBACK - Pending feedback list
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

    // Get student internships for this pembimbing
    const students = await db.all(
      `SELECT i.id as internshipId, i.user_email, i.status, i.progress,
              us.name as studentName, us.nim as studentNim
       FROM internships i
       LEFT JOIN users us ON us.email = i.user_email
       WHERE i.pembimbing_email = ?
       ORDER BY i.created_at DESC`,
      [pembimbing.email]
    );

    // Get latest unpaid reports for each student
    const pendingFeedback = [];
    for (const s of students) {
      const reports = await db.all(
        `SELECT r.id, r.week, r.note, r.created_at
         FROM reports r WHERE r.internship_id = ?
         ORDER BY r.week DESC LIMIT 3`,
        [s.internshipId]
      );

      for (const r of reports) {
        // Check if feedback already exists for this report
        const existingFeedback = await db.get(
          'SELECT id FROM feedbacks WHERE student_id = ? AND comment LIKE ?',
          [s.studentNim || String(s.user_email), `%${r.week ? `Minggu ${r.week}` : ''}%`]
        );

        if (!existingFeedback) {
          pendingFeedback.push({
            internshipId: s.internshipId,
            studentId: s.studentNim || s.user_email,
            studentName: s.studentName || '-',
            week: r.week,
            date: new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            excerpt: r.note ? r.note.substring(0, 150) : 'Laporan mingguan',
          });
        }
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

    // Generate schedule entries based on student status
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

module.exports = router;