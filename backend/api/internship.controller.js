const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const starlark = require("../engine/starlark.engine");
const vrule = require("../services/vrule.service");
const workflow = require("../services/workflow.service");
const nats = require("../services/nats.service");
const audit = require("../services/audit.service");
const db = require("../integrations/database.client");
const authMiddleware = require("../middleware/auth.middleware");

// ─── Multer config ──────────────────────────────
const uploadDir = path.join(__dirname, "..", "uploads", "documents");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp_originalName
        const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max per file
    fileFilter: (req, file, cb) => {
        const allowed = /\.(pdf|jpg|jpeg|png|docx|zip)$/i;
        const ext = path.extname(file.originalname);
        if (allowed.test(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`Format file ${ext} tidak didukung.`));
        }
    },
});

// ==============================
// REGISTER - Workflow 1: Internship Registration
// ==============================
router.post("/register", upload.array("documents", 10), async (req, res) => {
    try {
        // Multer parses multipart/form-data
        // req.body contains text fields, req.files contains uploaded files
        const data = req.body;
        console.log('[REGISTER] Received body fields:', JSON.stringify(data, null, 2));
        console.log('[REGISTER] Received files:', (req.files || []).map(f => f.originalname));

        // Attach file info to data for the workflow
        const uploadedDocs = (req.files || []).map(file => ({
            fieldname: file.fieldname,
            originalname: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
        }));

        // Add documents info and auth user data
        const payload = {
            ...data,
            uploadedFiles: uploadedDocs,
            user: req.user || null, // from auth middleware if present
        };

        console.log('[REGISTER] Triggering wf_registration with:', { name: payload.name, nim: payload.nim, email: payload.email });

        // Trigger W1: Registration workflow
        const result = await workflow.trigger("wf_registration", payload);

        if (result.status === 'failed') {
            return res.status(400).json({
                success: false,
                message: result.message || "Pendaftaran gagal",
                data: result
            });
        }

        // If registration success, auto-trigger W2: Eligibility
        const internshipId = result.data?.internshipId;
        let eligibilityResult = null;
        if (internshipId) {
            eligibilityResult = await workflow.trigger("wf_eligibility", { internshipId });
        }

        res.json({
            success: true,
            message: "Pendaftaran berhasil diproses",
            data: {
                registration: result,
                eligibility: eligibilityResult,
                internshipId,
                uploadedFiles: uploadedDocs.map(f => f.originalname)
            }
        });
    } catch (err) {
        console.error("[INTERNSHIP] Register error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Terjadi kesalahan saat pendaftaran"
        });
    }
});

// ==============================
// STATUS - Get internship status
// ==============================
router.get("/status", authMiddleware, async (req, res) => {
    const { role } = req.query;
    const userId = req.user?.id;

    const user = await db.get("SELECT email, role FROM users WHERE id=?", [userId]);
    if (!user?.email) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const internship = await db.get(
        "SELECT id, status, progress, company, eligibility_score, match_score, final_score, grade, certificate_code FROM internships WHERE user_email=? ORDER BY created_at DESC LIMIT 1",
        [user.email]
    );

    res.json({
        success: true,
        role: role || user.role || "mahasiswa",
        data: internship ? {
            id: internship.id,
            status: internship.status || "pending",
            progress: internship.progress ?? 0,
            company: internship.company || null,
            eligibilityScore: internship.eligibility_score,
            matchScore: internship.match_score,
            finalScore: internship.final_score,
            grade: internship.grade,
            certificateCode: internship.certificate_code,
        } : null,
        message: "Status retrieved successfully"
    });
});

// ==============================
// WORKFLOW - Trigger specific workflow for internship
// ==============================
router.post("/workflow/:workflowName", authMiddleware, async (req, res) => {
    try {
        const { workflowName } = req.params;
        const { internshipId, ...extra } = req.body;

        if (!internshipId) {
            return res.status(400).json({ success: false, message: "internshipId diperlukan" });
        }

        const result = await workflow.trigger(`wf_${workflowName}`, { internshipId, ...extra });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================
// ASSIGN PEMBIMBING (Admin) - Triggers W3: Approval
// ==============================
router.post("/assign-pembimbing", authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { internshipId, pembimbingEmail } = req.body;
        if (!internshipId || !pembimbingEmail) {
            return res.status(400).json({ success: false, message: "internshipId dan pembimbingEmail diperlukan" });
        }

        // Check pembimbing exists
        const pembimbing = await db.get(
            'SELECT id, name, email FROM users WHERE email = ? AND role = ?',
            [pembimbingEmail, 'pembimbing']
        );
        if (!pembimbing) {
            return res.status(404).json({ success: false, message: "Pembimbing tidak ditemukan" });
        }

        // Trigger W3: Approval
        const result = await workflow.trigger("wf_approval", {
            internshipId,
            action: 'approve',
            pembimbingEmail
        });

        res.json({
            success: true,
            message: result.data?.approved ? "Pembimbing berhasil ditugaskan" : "Gagal menugaskan pembimbing",
            data: result
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================
// ASSIGN COMPANY (Admin) - Triggers W4: Company Placement
// ==============================
router.post("/assign-company", authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { internshipId, companyId } = req.body;
        if (!internshipId || !companyId) {
            return res.status(400).json({ success: false, message: "internshipId dan companyId diperlukan" });
        }

        const result = await workflow.trigger("wf_company_placement", { internshipId, companyId });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================
// EVALUATE (Admin) - Triggers W6: Performance Evaluation
// ==============================
router.post("/evaluate", authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { internshipId } = req.body;
        if (!internshipId) {
            return res.status(400).json({ success: false, message: "internshipId diperlukan" });
        }

        const result = await workflow.trigger("wf_performance_evaluation", { internshipId });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================
// CERTIFY (Admin) - Triggers W7: Certification
// ==============================
router.post("/certify", authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { internshipId } = req.body;
        if (!internshipId) {
            return res.status(400).json({ success: false, message: "internshipId diperlukan" });
        }

        const result = await workflow.trigger("wf_certification", { internshipId });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Admin create internship directly (bypass workflow)
router.post('/admin/create', authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { name, nim, email, prodi, year, status, company, pembimbing_email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email diperlukan' });
        }

        const result = await db.run(
            `INSERT INTO internships (name, nim, user_email, prodi, year, status, company, pembimbing_email) 
             VALUES (?,?,?,?,?,?,?,?)`,
            [name || null, nim || null, email, prodi || null, year || null, status || 'pending', company || null, pembimbing_email || null]
        );

        const internship = await db.get('SELECT * FROM internships WHERE id=?', [result.id]);
        res.json({ success: true, data: internship });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to create internship' });
    }
});

module.exports = router;
