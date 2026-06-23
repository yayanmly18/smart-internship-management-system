const express = require('express');
const router = express.Router();

const db = require('../integrations/database.client');
const authMiddleware = require('../middleware/auth.middleware');

// Perusahaan:
// - Ditambah/hapus oleh admin
// - Dampaknya ke pembimbing & mahasiswa (FE saat ini banyak yang masih mock)
// - Untuk DB side, kita simpan di tabel internships.company dan/atau menambah tabel khusus perusahaan.
// 
// Dalam repo ini belum ada tabel "companies".
// Solusi minimal: simpan sebagai daftar pada internships.company (tapi ini kurang rapi).
// Agar konsisten, kita implement tabel companies baru jika belum ada.

async function ensureCompaniesTable() {
  await db.run(`CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    city TEXT,
    bidang TEXT,
    quota INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
}

// List companies (admin + pembimbing + mahasiswa)
router.get('/companies', authMiddleware, async (req, res) => {
  try {
    await ensureCompaniesTable();

    const rows = await db.all('SELECT id, name, city, bidang, quota, created_at FROM companies ORDER BY created_at DESC');
    
    // Add filled count for each company
    const companiesWithCount = await Promise.all(rows.map(async (company) => {
      const filled = await db.get(
        `SELECT COUNT(*) as count FROM internships 
         WHERE company = ? AND status IN ('aktif', 'diterima', 'selesai')`,
        [company.name]
      );
      return {
        ...company,
        filled: filled?.count || 0
      };
    }));
    
    return res.json({ success: true, data: companiesWithCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to list companies' });
  }
});

// Create company (admin only)
router.post('/companies', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
    await ensureCompaniesTable();

    const { name, city, bidang, quota } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });

    const q = quota === undefined || quota === null || quota === '' ? 0 : Number(quota);

    const result = await db.run(
      'INSERT INTO companies (name, city, bidang, quota) VALUES (?,?,?,?)',
      [name, city ?? null, bidang ?? null, q]
    );

    const company = await db.get('SELECT id, name, city, bidang, quota, created_at FROM companies WHERE id=?', [result.id]);
    return res.json({ success: true, data: company });
  } catch (err) {
    console.error(err);
    if (err && err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'Company already exists' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create company' });
  }
});

// Delete company (admin only)
router.delete('/companies/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
    await ensureCompaniesTable();

    const id = req.params.id;

    // Delete company record
    const result = await db.run('DELETE FROM companies WHERE id=?', [id]);

    // Minimal impact: perusahaan yang sudah ada di internships tetap tersimpan sebagai string.
    // Kalau kamu ingin "terhapus total" dari pilihan mahasiswa/pembimbing,
    // perlu aturan migrasi: update internships.company atau filtering di FE.

    return res.json({ success: true, message: 'Company deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to delete company' });
  }
});

module.exports = router;

