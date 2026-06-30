const express = require('express');
const router = express.Router();
const db = require('../integrations/database.client');
const authMiddleware = require('../middleware/auth.middleware');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Helper to stream PDF
function streamPDF(res, title, buildDoc) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title}.pdf"`);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);
  buildDoc(doc);
  doc.end();
}

// Helper to stream Excel
async function streamExcel(res, title, buildWorkbook) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${title}.xlsx"`);
  const workbook = new ExcelJS.Workbook();
  await buildWorkbook(workbook);
  await workbook.xlsx.write(res);
  res.end();
}

// 1) Rekap Nilai Semester (PDF)
router.get('/semester-grades', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });

    const rows = await db.all(`
      SELECT u.name, u.nim, u.prodi, u.year,
             i.status, i.progress, i.company,
             f.score, f.comment, f.created_at as feedback_date
      FROM users u
      LEFT JOIN internships i ON i.user_email = u.email
      LEFT JOIN feedbacks f ON f.student_id = u.nim AND f.internship_id = i.id
      WHERE u.role = 'mahasiswa'
      ORDER BY u.year DESC, u.name ASC
    `);

    streamPDF(res, 'rekap-nilai-semester', (doc) => {
      doc.fontSize(18).text('Rekap Nilai Semester', { align: 'center' });
      doc.moveDown();
      rows.forEach((r, idx) => {
        doc.fontSize(11).text(`${idx + 1}. ${r.name} (${r.nim}) - ${r.prodi} - ${r.company || '-'} - Nilai: ${r.score ?? '-'}`);
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

// 2) Daftar Mahasiswa Aktif (XLSX)
router.get('/active-students', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });

    const rows = await db.all(`
      SELECT u.name, u.nim, u.email, u.prodi, u.year, u.phone,
             i.status, i.progress, i.company, i.pembimbing_email
      FROM users u
      LEFT JOIN internships i ON i.user_email = u.email
      WHERE u.role = 'mahasiswa' AND (i.status = 'aktif' OR i.status = 'diterima')
      ORDER BY u.name ASC
    `);

    await streamExcel(res, 'daftar-mahasiswa-aktif', async (workbook) => {
      const sheet = workbook.addWorksheet('Mahasiswa Aktif');
      sheet.columns = [
        { header: 'Nama', key: 'name', width: 25 },
        { header: 'NIM', key: 'nim', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Prodi', key: 'prodi', width: 20 },
        { header: 'Angkatan', key: 'year', width: 12 },
        { header: 'No HP', key: 'phone', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Progress', key: 'progress', width: 12 },
        { header: 'Perusahaan', key: 'company', width: 25 },
        { header: 'Pembimbing', key: 'pembimbing', width: 25 },
      ];
      sheet.getRow(1).font = { bold: true };
      rows.forEach((r) => {
        const pemb = r.pembimbing_email || '-';
        sheet.addRow({
          name: r.name, nim: r.nim, email: r.email, prodi: r.prodi, year: r.year, phone: r.phone,
          status: r.status, progress: r.progress, company: r.company || '-', pembimbing: pemb,
        });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

// 3) Statistik Perusahaan (PDF)
router.get('/company-stats', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });

    const companies = await db.all('SELECT name, city, bidang, quota FROM companies ORDER BY name ASC');
    const stats = await Promise.all(companies.map(async (c) => {
      const filled = await db.get(
        `SELECT COUNT(*) as count FROM internships WHERE company = ? AND status IN ('aktif','diterima','selesai')`,
        [c.name]
      );
      return { ...c, filled: filled?.count || 0 };
    }));

    streamPDF(res, 'statistik-perusahaan', (doc) => {
      doc.fontSize(18).text('Statistik Perusahaan', { align: 'center' });
      doc.moveDown();
      stats.forEach((s, idx) => {
        doc.fontSize(11).text(`${idx + 1}. ${s.name} (${s.bidang || '-'}) - ${s.city || '-'} - Kuota: ${s.quota} - Terisi: ${s.filled}`);
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

// 0) Report Statistics (public for dashboard cards)
router.get('/stats', async (req, res) => {
  try {


    const totalMahasiswa = await db.get("SELECT COUNT(*) as c FROM users WHERE role = 'mahasiswa'");

    // "Sedang magang" = status internship yang aktif/diterima (diterima biasanya otomatis aktif)
    const aktifMahasiswa = await db.get(
      "SELECT COUNT(*) as c FROM internships WHERE status IN ('aktif', 'diterima')"
    );

    // "Perusahaan Mitra" seharusnya berdasarkan perusahaan yang benar-benar terpakai di internship
    // (bukan semua perusahaan yang ada di tabel companies)
    const totalPerusahaan = await db.get(
      "SELECT COUNT(DISTINCT company) as c FROM internships WHERE company IS NOT NULL AND company != '-'"
    );

    // Calculate average score from feedbacks
    const avgScore = await db.get("SELECT AVG(score) as avg FROM feedbacks");

    res.json({
      success: true,
      data: {
        totalMahasiswa: totalMahasiswa?.c || 0,
        aktifMahasiswa: aktifMahasiswa?.c || 0,
        totalPerusahaan: totalPerusahaan?.c || 0,
        avgScore: avgScore?.avg ? Number(avgScore.avg).toFixed(1) : '-'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get stats' });
  }
});

// 4) Laporan Evaluasi (PDF)
router.get('/evaluation', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });

    const rows = await db.all(`
      SELECT u.name, u.nim, u.prodi,
             i.company, i.status,
             f.score, f.comment, f.created_at as feedback_date
      FROM users u
      LEFT JOIN internships i ON i.user_email = u.email
      LEFT JOIN feedbacks f ON f.student_id = u.nim AND f.internship_id = i.id
      WHERE u.role = 'mahasiswa'
      ORDER BY f.created_at DESC
    `);

    streamPDF(res, 'laporan-evaluasi', (doc) => {
      doc.fontSize(18).text('Laporan Evaluasi', { align: 'center' });
      doc.moveDown();
      rows.forEach((r, idx) => {
        doc.fontSize(11).text(`${idx + 1}. ${r.name} (${r.nim}) - ${r.company || '-'} - Nilai: ${r.score ?? '-'} - Komentar: ${r.comment || '-'}`);
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

module.exports = router;