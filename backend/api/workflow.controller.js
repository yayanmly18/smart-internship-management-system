const express = require("express");
const router = express.Router();
const workflow = require("../services/workflow.service");
const vrule = require("../services/vrule.service");
const db = require("../integrations/database.client");
const authMiddleware = require("../middleware/auth.middleware");
const vflow = require("../integrations/vflow.client");

// ================================================================
// WORKFLOW API ENDPOINTS
// ================================================================

// List all workflows
router.get("/list", async (req, res) => {
  const result = await workflow.list();
  res.json({ success: true, data: result });
});

// List all VRules
router.get("/rules", async (req, res) => {
  const rules = vrule.listRules();
  res.json({ success: true, data: rules });
});

// Trigger a specific workflow
router.post("/trigger", async (req, res) => {
  const { name, payload } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Nama workflow diperlukan"
    });
  }

  try {
    const result = await vflow.triggerWorkflow(name, payload || {});

    return res.json({
      success: true,
      source: 'vflow',
      data: result
    });
  } catch (error) {
    if (!vflow.config.fallbackLocal) {
      return res.status(502).json({
        success: false,
        source: 'vflow',
        message: error.message,
        detail: error.responseData || null,
      });
    }

    const result = await workflow.trigger(name, payload || {});

    return res.json({
      success: true,
      source: 'local-fallback',
      data: result
    });
  }
});

// Run full pipeline
router.post("/pipeline", authMiddleware, async (req, res) => {
  try {
    const { internshipId, companyId, evaluate, certify } = req.body;
    if (!internshipId) {
      return res.status(400).json({ success: false, message: "internshipId diperlukan" });
    }
    const result = await workflow.runFullPipeline(internshipId, { companyId, evaluate, certify });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Upload report (triggers W5: Progress Monitoring)
router.post("/upload", authMiddleware, async (req, res) => {
  try {
    const { week, note } = req.body;
    const userId = req.user?.id;

    if (!week) {
      return res.status(400).json({ success: false, message: "week is required" });
    }

    const result = await workflow.trigger("wf_progress_monitoring", {
      week: Number(week),
      note,
      userId
    });

    res.json({
      success: true,
      message: `Laporan minggu ${week} diterima`,
      data: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Evaluate a VRule
router.post("/evaluate-rule", async (req, res) => {
  const { ruleName, data } = req.body;
  if (!ruleName) {
    return res.status(400).json({ success: false, message: "ruleName diperlukan" });
  }
  const result = await vrule.evaluate(ruleName, data || {});
  res.json({ success: true, data: result });
});

// Get workflow logs for an internship
router.get("/logs/:internshipId", authMiddleware, async (req, res) => {
  try {
    const { internshipId } = req.params;
    const logs = await db.all(
      "SELECT * FROM workflow_logs WHERE payload LIKE ? ORDER BY created_at DESC",
      [`%${internshipId}%`]
    );
    res.json({ success: true, data: logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get workflow status for current user
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await db.get("SELECT email FROM users WHERE id = ?", [userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const internship = await db.get(
      "SELECT * FROM internships WHERE user_email = ? ORDER BY created_at DESC LIMIT 1",
      [user.email]
    );

    if (!internship) {
      return res.json({ success: true, data: { hasInternship: false } });
    }

    // Get workflow logs for this internship
    const logs = await db.all(
      "SELECT * FROM workflow_logs WHERE payload LIKE ? ORDER BY created_at DESC LIMIT 20",
      [`%${internship.id}%`]
    );

    // Get assessments
    const assessments = await db.all(
      "SELECT * FROM assessments WHERE internship_id = ? ORDER BY created_at DESC",
      [internship.id]
    );

    // Get placements
    const placements = await db.all(
      "SELECT * FROM placements WHERE internship_id = ? ORDER BY created_at DESC",
      [internship.id]
    );

    // Get certificates
    const certificate = await db.get(
      "SELECT * FROM certificates WHERE internship_id = ?",
      [internship.id]
    );

    // Build workflow status
    const workflowStatus = {
      registration: internship.status !== 'pending' || internship.id ? 'completed' : 'pending',
      eligibility: assessments.some(a => a.assessment_type === 'eligibility') ? 'completed' : 'pending',
      approval: internship.pembimbing_email ? 'completed' : 'pending',
      placement: internship.company ? 'completed' : 'pending',
      monitoring: internship.progress > 0 ? 'in_progress' : 'pending',
      evaluation: assessments.some(a => a.assessment_type === 'performance') ? 'completed' : 'pending',
      certification: certificate ? 'completed' : 'pending',
    };

    res.json({
      success: true,
      data: {
        hasInternship: true,
        internship: {
          id: internship.id,
          status: internship.status,
          progress: internship.progress,
          company: internship.company,
          pembimbingEmail: internship.pembimbing_email,
          eligibilityScore: internship.eligibility_score,
          matchScore: internship.match_score,
          finalScore: internship.final_score,
          grade: internship.grade,
          certificateCode: internship.certificate_code,
        },
        workflowStatus,
        logs,
        assessments,
        placements,
        certificate
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Get all workflow statuses
router.get("/admin/all", authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const internships = await db.all(`
      SELECT i.id, i.user_email, i.name, i.nim, i.status, i.progress, i.company, 
             i.eligibility_score, i.match_score, i.final_score, i.grade, i.certificate_code,
             u.name as studentName
      FROM internships i
      LEFT JOIN users u ON u.email = i.user_email
      ORDER BY i.created_at DESC
    `);

    const result = [];
    for (const internship of internships) {
      const assessments = await db.all(
        "SELECT assessment_type, score FROM assessments WHERE internship_id = ?",
        [internship.id]
      );
      result.push({
        ...internship,
        assessments
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;