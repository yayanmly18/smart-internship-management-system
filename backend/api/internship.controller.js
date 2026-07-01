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
const vflow = require("../integrations/vflow.client");
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
// Backend bertindak sebagai caller ke VFlow.
// ==============================
router.post("/register", upload.array("documents", 10), async (req, res) => {
    try {
        const data = req.body;

        console.log('[REGISTER] Received body fields:', JSON.stringify(data, null, 2));
        console.log('[REGISTER] Received files:', (req.files || []).map(f => f.originalname));

        const uploadedDocs = (req.files || []).map(file => ({
            fieldname: file.fieldname,
            originalname: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
        }));

        const payload = {
            ...data,
            uploadedFiles: uploadedDocs,
            user: req.user || null,
            submittedAt: new Date().toISOString(),
            source: 'backend-express-caller',
        };

        if (!payload.email || !payload.name || !payload.nim) {
            return res.status(400).json({
                success: false,
                message: 'Nama, NIM, dan email diperlukan'
            });
        }

        console.log('[REGISTER] Calling VFlow webhook:', vflow.config.paths.registration);

        let vflowResult = null;
        let localResult = null;
        let internshipId = null;
        let workflowStatus = 'received';
        let source = 'vflow';

        try {
            vflowResult = await vflow.triggerRegistration(payload);
            
            // Tangani isu SSE (0 bytes response)
            if (vflowResult && vflowResult.rawBytes === 0) {
                throw new Error('VFlow returned empty body (0 bytes) — SSE proxy issue');
            }

            const vflowData = vflowResult.data || {};
            console.log('[REGISTER] vflowResult.data:', JSON.stringify(vflowData, null, 2));
            
            workflowStatus = vflowData.status || vflowData.registrationStatus || 'received';
            internshipId = vflowData.internshipId || vflowData.internship_id || vflowData.id || null;
            console.log('[REGISTER] Extracted internshipId from VFlow:', internshipId);

            await audit.log({
                action: 'REGISTER_INTERNSHIP_VFLOW',
                data: {
                    path: vflow.config.paths.registration,
                    email: payload.email,
                    nim: payload.nim,
                    status: workflowStatus,
                    vflowResponse: vflowData,
                },
            });
        } catch (vflowError) {
            console.error('[REGISTER] VFlow error:', vflowError.message);

            if (!vflow.config.fallbackLocal) {
                return res.status(502).json({
                    success: false,
                    message: 'VFlow registration gagal.',
                    detail: vflowError.responseData || vflowError.message,
                });
            }

            console.warn('[REGISTER] Falling back to local workflow because VFLOW_FALLBACK_LOCAL=true');
            source = 'local-fallback';
            localResult = await workflow.trigger("wf_registration", payload);

            if (localResult.status === 'failed') {
                if (localResult.internshipId) {
                    // Berarti VFlow tadi sebenarnya BERHASIL melakukan INSERT ke database
                    // namun gagal mengembalikan response karena isu SSE.
                    // Jadi kita gunakan internshipId yang sudah ada ini.
                    internshipId = localResult.internshipId;
                    workflowStatus = 'pending';
                    console.log('[REGISTER] Recovered internshipId from existing record:', internshipId);
                } else {
                    return res.status(400).json({
                        success: false,
                        source: 'local-fallback',
                        message: localResult.message || 'Pendaftaran gagal',
                        data: localResult,
                    });
                }
            } else {
                internshipId = localResult.data ? localResult.data.internshipId : null;
                workflowStatus = localResult.data ? localResult.data.registrationStatus : 'received';
                console.log('[REGISTER] Extracted internshipId from local:', internshipId);
            }
        }

        // AUTO-TRIGGER ELIGIBILITY WORKFLOW
        let eligibilityResult = null;
        if (internshipId) {
            console.log('[REGISTER] Auto-triggering Eligibility for ID:', internshipId);
            try {
                // Update tabel users dengan ipk dan semester dari form agar dibaca oleh VRule
                const ipk = parseFloat(payload.ipk || payload.gpa || 0);
                const semester = parseInt(payload.semester || 1);
                if (ipk > 0) {
                    await db.run('UPDATE users SET gpa = ?, semester = ? WHERE email = ?', [ipk, semester, payload.email]);
                }

                eligibilityResult = await vflow.triggerWorkflow("wf_eligibility", { internship_id: internshipId });
                if (eligibilityResult && eligibilityResult.rawBytes === 0) throw new Error("0 bytes from Eligibility SSE");
            } catch (eligErr) {
                console.error('[REGISTER] Auto-trigger Eligibility (VFlow) error:', eligErr.message);
                if (vflow.config.fallbackLocal) {
                    console.log('[REGISTER] Falling back to local Eligibility workflow');
                    eligibilityResult = await workflow.trigger("wf_eligibility", { internshipId });
                }
            }
        }

        res.json({
            success: true,
            source,
            message: 'Pendaftaran berhasil, dan proses seleksi kelayakan otomatis dijalankan.',
            data: {
                vflow: vflowResult,
                localResult,
                internshipId,
                registrationStatus: workflowStatus,
                eligibilityStatus: eligibilityResult ? (eligibilityResult.data || eligibilityResult) : null,
                uploadedFiles: uploadedDocs.map(f => f.originalname),
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

// Admin create/update internship directly (bypass workflow) - UPSERT by user_email
router.post('/admin/create', authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { name, nim, email, prodi, year, status, company, pembimbing_email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email diperlukan' });
        }

        // Check if an internship already exists for this email
        const existing = await db.get(
            'SELECT id FROM internships WHERE user_email = ? ORDER BY created_at DESC LIMIT 1',
            [email]
        );

        let internship;
        if (existing) {
            // UPDATE existing internship
            await db.run(
                `UPDATE internships SET 
                    name = COALESCE(?, name),
                    nim = COALESCE(?, nim),
                    prodi = COALESCE(?, prodi),
                    year = COALESCE(?, year),
                    status = COALESCE(?, status),
                    company = COALESCE(?, company),
                    pembimbing_email = COALESCE(?, pembimbing_email),
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [name || null, nim || null, prodi || null, year || null, status || null, company || null, pembimbing_email || null, existing.id]
            );
            internship = await db.get('SELECT * FROM internships WHERE id=?', [existing.id]);
        } else {
            // INSERT new internship
            const result = await db.run(
                `INSERT INTO internships (name, nim, user_email, prodi, year, status, company, pembimbing_email) 
                 VALUES (?,?,?,?,?,?,?,?)`,
                [name || null, nim || null, email, prodi || null, year || null, status || 'pending', company || null, pembimbing_email || null]
            );
            internship = await db.get('SELECT * FROM internships WHERE id=?', [result.id]);
        }

        res.json({ success: true, data: internship });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to create/update internship' });
    }
});

module.exports = router;
