const express = require('express');
const router = express.Router();

const db = require('../integrations/database.client');
const authMiddleware = require('../middleware/auth.middleware');

// Pembimbing profile: nama dosen + NIP
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await db.get(
      'SELECT name, nip, email, role FROM users WHERE id = ? AND role = ?',
      [userId, 'pembimbing']
    );


    // Query di atas agak defensive (OR), tapi tetap aman karena id dibatasi.
    if (!user?.name) {
      return res.status(404).json({ success: false, message: 'Pembimbing not found' });
    }

    res.json({ success: true, data: { name: user.name, nip: user.nip ?? null, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get pembimbing profile' });
  }
});

// Mahasiswa bimbingan: dari internships.pembimbing_email
router.get('/students', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const pembimbing = await db.get('SELECT email FROM users WHERE id = ? AND role = ?', [userId, 'pembimbing']);
    if (!pembimbing?.email) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const rows = await db.all(
      `SELECT
        i.id AS "internshipId",
        i.user_email,

        -- Student (wajib dari users)
        us.name AS "studentName",
        us.nim AS "studentNim",

        -- Pembimbing (wajib dari users)
        ub.name AS "pembimbingName",
        ub.nip AS "pembimbingNip",
        ub.email AS "pembimbingEmail",

        i.company,
        i.status,
        i.progress,
        i.year,
        i.prodi
      FROM internships i
      LEFT JOIN users us ON LOWER(us.email) = LOWER(i.user_email)
      LEFT JOIN users ub ON LOWER(ub.email) = LOWER(i.pembimbing_email) AND ub.role = 'pembimbing'
      WHERE LOWER(i.pembimbing_email) = LOWER(?)
      ORDER BY i.created_at DESC`,
      [pembimbing.email]
    );

    // Karena internship bisa ada multiple per student, tampilkan per user_email terbaru.
    const byStudent = new Map();
    for (const r of rows || []) {
      const key = r.user_email || r.internshipId;
      if (!byStudent.has(key)) {
        byStudent.set(key, r);
      }
    }

    // Enrich students with report count and average score
    const students = Array.from(byStudent.values()).map(async (r) => {
      // Count reports for this student
      const reportCountResult = await db.get(
        'SELECT COUNT(*) as count FROM reports WHERE internship_id = ?',
        [r.internshipId]
      );
      const reportCount = parseInt(reportCountResult?.count || 0);

      // Calculate average score from feedbacks
      const feedbacks = await db.all(
        `SELECT score FROM feedbacks
         WHERE student_id = ? AND internship_id = ?`,
        [r.studentNim || r.user_email, r.internshipId]
      );
      
      const scores = feedbacks.filter(f => f.score).map(f => f.score);
      const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : null;

      return {
        internshipId: r.internshipId,
        userEmail: r.user_email,

        // Pastikan studentName/studentNim murni dari users
        studentName: r.studentName,
        studentNim: r.studentNim ?? null,

        company: r.company || '-',
        status: r.status || 'pending',
        progress: r.progress ?? 0,

        pembimbing: {
          name: r.pembimbingName ?? null,
          nip: r.pembimbingNip ?? null,
          email: r.pembimbingEmail ?? null,
        },

        // Add enriched data
        reportCount,
        avgScore,
      };
    });

    const resolvedStudents = await Promise.all(students);

    res.json({ success: true, data: { students: resolvedStudents } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get students' });
  }
});

module.exports = router;

