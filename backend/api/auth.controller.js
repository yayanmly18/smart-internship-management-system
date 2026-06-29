const express = require("express");
const router = express.Router();
const db = require("../integrations/database.client");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'devsecret';

router.post("/login", async (req, res) => {
    const { email, password, role } = req.body;


    if (!email || !password) return res.status(400).json({ success: false, message: "Email dan password diperlukan" });

    try {
        const row = await db.get(
            "SELECT id, name, nim, email, prodi, year, phone, password, role FROM users WHERE email = ? AND role = ?",
            [email, role]
        );



        if (!row) {
            return res.status(401).json({ success: false, message: "Login gagal" });
        }

        const match = await bcrypt.compare(password, row.password);
        if (!match) {
            return res.status(401).json({ success: false, message: "Login gagal" });
        }

        const { password: _p, ...user } = row;

        // Get internship data if exists (for mahasiswa role)
        let internship = null;
        if (user.role === 'mahasiswa') {
            internship = await db.get(
                `SELECT id, status, progress, company, pembimbing_email
                 FROM internships WHERE user_email = ? ORDER BY created_at DESC LIMIT 1`,
                [user.email]
            );
        }

        const userData = {
            ...user,
            internship: internship || null
        };

        const token = jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: '8h' });
        res.json({ success: true, message: "Login berhasil", data: userData, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Login error" });
    }
});

router.post("/register", async (req, res) => {
    const { name, nim, nip, email, prodi, year, phone, password, role } = req.body;

    console.log('[REGISTER] Request body:', JSON.stringify(req.body));

    if (!email || !password) return res.status(400).json({ success: false, message: "Email dan password diperlukan" });

    try {
        const hashed = await bcrypt.hash(password, 10);
        const result = await db.run(
          "INSERT INTO users (name, nim, nip, email, prodi, year, phone, password, role) VALUES (?,?,?,?,?,?,?,?,?)",
          [name || null, nim || null, nip || null, email, prodi || null, year || null, phone || null, hashed, role || 'mahasiswa']
        );
        console.log('[REGISTER] User created, id=', result.id);


        const user = await db.get(
          "SELECT id, name, nim, nip, email, prodi, year, phone, role FROM users WHERE id = ?",
          [result.id]
        );


        res.json({ success: true, message: "Register berhasil", data: user });
    } catch (err) {
        console.error(err);
        if (err && err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ success: false, message: "Email sudah terdaftar" });
        }
        res.status(500).json({ success: false, message: "Register gagal" });
    }
});

// List users (no auth) - returns non-sensitive fields
const authMiddleware = require('../middleware/auth.middleware');

router.get('/users', authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
        const rows = await db.all('SELECT id, name, nim, email, prodi, year, phone, role FROM users');


        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to list users' });
    }
});

// Update user (admin only)
router.put('/users/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
        const id = req.params.id;
        const { name, nim, nip, email, prodi, year, phone, role } = req.body;
        await db.run(
          'UPDATE users SET name=?, nim=?, nip=?, email=?, prodi=?, year=?, phone=?, role=? WHERE id=?',
          [name, nim, nip, email, prodi, year, phone, role, id]
        );
        const user = await db.get(
          'SELECT id, name, nim, nip, email, prodi, year, phone, role FROM users WHERE id=?',
          [id]
        );

        res.json({ success: true, data: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
});

// Delete user (admin only)
router.delete('/users/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
        const id = req.params.id;
        await db.run('DELETE FROM users WHERE id=?', [id]);
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

// Applicants list (admin only)
router.get('/applicants', authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });

        // Data mahasiswa peserta magang: gabungkan users (identitas) + internships (status/progres/perusahaan/pembimbing)
        // ipk/semester belum ada di schema saat ini -> dikirim sebagai '-' untuk kompatibilitas FE.
        // Use subquery to get only the latest internship per user (by max id)
        const rows = await db.all(
            `SELECT 
                u.id as userId,
                u.name,
                u.nim,
                u.email,
                u.prodi,
                u.year,
                i.status,
                i.progress,
                i.company,
                i.pembimbing_email,
                i.id as internshipId
             FROM users u
             LEFT JOIN internships i ON i.id = (
               SELECT MAX(i2.id) FROM internships i2 WHERE i2.user_email = u.email
             )
             WHERE u.role = 'mahasiswa'
             ORDER BY u.id DESC`
        );

        const normalizeStatus = (raw) => {
            const s = String(raw ?? 'pending').trim().toLowerCase();
            if (!s) return 'pending';

            // Normalisasi agar FE bisa filter tepat: aktif/seleksi/selesai/ditolak/pending
            if (["aktif", "active", "in_progress", "berjalan", "ongoing"].includes(s)) return 'aktif';
            if (["seleksi", "selection", "seleksi_berkas", "selected", "in_selection"].includes(s)) return 'seleksi';
            if (["selesai", "finished", "done", "completed", "lulus", "passed"].includes(s)) return 'selesai';
            if (["ditolak", "rejected", "reject", "declined", "failed"].includes(s)) return 'ditolak';
            if (["pending", "menunggu", "draft", "in_review", "review", "process"].includes(s)) return 'pending';

            // fallback: pakai nilai asli agar tidak hilang, tapi sudah lowercase
            return s;
        };

        const mapped = (rows || []).map(r => ({
            id: String(r.nim || r.userId),
            nama: r.name || '-',
            prodi: r.prodi || '-',
            ipk: '-',
            semester: r.year ? r.year : '-',
            status: normalizeStatus(r.status),
            perusahaan: r.company || '-',
             pembimbing: r.pembimbing_email || '-',
            progress: r.progress ?? 0,
            userEmail: r.email,
            internshipId: r.internshipId ?? null,
        }));

        res.json({ success: true, data: mapped });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to get applicants' });
    }
});

// Dashboard summary (admin only)
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });

        // basic counts from users table
        const total = await db.get('SELECT COUNT(*) as c FROM users');
        const byRole = await db.all('SELECT role, COUNT(*) as c FROM users GROUP BY role');

        // map roles
        const roleCounts = {};
        (byRole || []).forEach(r => { roleCounts[r.role] = r.c; });

        // Real monthly data from internships
        const monthlyRaw = await db.all(
            `SELECT EXTRACT(MONTH FROM created_at) as month_num,
                    TO_CHAR(created_at, 'Mon') as bulan,
                    COUNT(*) as daftar,
                    SUM(CASE WHEN status IN ('selesai','lulus','completed') THEN 1 ELSE 0 END) as lulus
             FROM internships
             WHERE created_at IS NOT NULL
             GROUP BY month_num
             ORDER BY month_num`
        );
        const monthly = monthlyRaw.length > 0 ? monthlyRaw : [
            { bulan: 'Jan', daftar: 0, lulus: 0 }, { bulan: 'Feb', daftar: 0, lulus: 0 },
            { bulan: 'Mar', daftar: 0, lulus: 0 }, { bulan: 'Apr', daftar: 0, lulus: 0 },
            { bulan: 'Mei', daftar: 0, lulus: 0 }, { bulan: 'Jun', daftar: 0, lulus: 0 },
        ];

        // Real status distribution from internships
        const statusRaw = await db.all(
            `SELECT status, COUNT(*) as count FROM internships GROUP BY status`
        );
        const statusMap = { aktif: 0, selesai: 0, seleksi: 0, ditolak: 0 };
        const colorMap = { aktif: '#2563EB', selesai: '#10B981', seleksi: '#F59E0B', ditolak: '#EF4444' };
        (statusRaw || []).forEach(r => {
            const s = String(r.status || '').toLowerCase();
            if (s === 'aktif' || s === 'active' || s === 'approved') statusMap.aktif += r.count;
            else if (s === 'selesai' || s === 'completed' || s === 'lulus') statusMap.selesai += r.count;
            else if (s === 'seleksi' || s === 'selection' || s === 'pending') statusMap.seleksi += r.count;
            else if (s === 'ditolak' || s === 'rejected') statusMap.ditolak += r.count;
            else statusMap.seleksi += r.count; // unknown → seleksi
        });
        const status = [
            { name: 'Aktif', value: statusMap.aktif, color: colorMap.aktif },
            { name: 'Selesai', value: statusMap.selesai, color: colorMap.selesai },
            { name: 'Seleksi', value: statusMap.seleksi, color: colorMap.seleksi },
            { name: 'Ditolak', value: statusMap.ditolak, color: colorMap.ditolak },
        ];

        res.json({ success: true, data: {
            totalUsers: total?.c || 0,
            roleCounts,
            monthly,
            status,
            // convenience fields
            totalApplicants: roleCounts['mahasiswa'] || 0,
            admins: roleCounts['admin'] || 0,
            pembimbings: roleCounts['pembimbing'] || 0,
        }});
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to get dashboard' });
    }
});

// Update applicant status + assign company + assign pembimbing (admin only)
router.put('/applicants/:internshipId', authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
        const internshipId = req.params.internshipId;
        const { status, companyId, companyName, pembimbingEmail } = req.body;

        const internship = await db.get('SELECT * FROM internships WHERE id=?', [internshipId]);
        if (!internship) return res.status(404).json({ success: false, message: 'Internship not found' });

        const oldStatus = String(internship.status || 'pending').toLowerCase();
        const newStatus = status ? String(status).toLowerCase() : oldStatus;
        const isAccepted = ['aktif', 'diterima'].includes(newStatus);
        const wasAccepted = ['aktif', 'diterima'].includes(oldStatus);

        // Update status
        if (status) {
            const validStatuses = ['pending', 'seleksi', 'diterima', 'ditolak', 'aktif', 'selesai'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: 'Status tidak valid' });
            }
            await db.run('UPDATE internships SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [status, internshipId]);
        }

        // Assign company
        if (companyName) {
            await db.run('UPDATE internships SET company=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [companyName, internshipId]);
        }

        // Assign pembimbing
        if (pembimbingEmail) {
            const pembimbing = await db.get('SELECT id, name, email FROM users WHERE email=? AND role=?', [pembimbingEmail, 'pembimbing']);
            if (!pembimbing) return res.status(400).json({ success: false, message: 'Pembimbing tidak ditemukan' });
            await db.run('UPDATE internships SET pembimbing_email=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [pembimbingEmail, internshipId]);
        }

        // Decrement company quota if student is accepted (only when transitioning to accepted status)
        if (isAccepted && !wasAccepted && companyName) {
            await db.run('UPDATE companies SET quota = MAX(0, quota - 1) WHERE name=?', [companyName]);
        }

        const updated = await db.get('SELECT * FROM internships WHERE id=?', [internshipId]);
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update applicant' });
    }
});

// List all pembimbing (admin only)
router.get('/pembimbing', authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
        const rows = await db.all('SELECT id, name, nip, email FROM users WHERE role=?', ['pembimbing']);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to list pembimbing' });
    }
});

module.exports = router;
