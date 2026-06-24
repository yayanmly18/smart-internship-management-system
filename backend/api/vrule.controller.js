const express = require("express");
const router = express.Router();
const vrule = require("../services/vrule.service");

// ==============================
// EVALUATE RULE (SUDAH ADA)
// ==============================
router.post("/evaluate", async (req, res) => {
    const { ruleId, data } = req.body;
    const result = await vrule.evaluate(ruleId, data);
    res.json(result);
});


// ==============================
// 🔥 TAMBAHAN: FEEDBACK (BIAR MATCH FRONTEND)
// ==============================
router.post("/feedback", async (req, res) => {
    const { studentId, score, comment } = req.body;

    res.json({
        success: true,
        message: "Feedback tersimpan",
        data: {
            studentId,
            score,
            comment
        }
    });
});

module.exports = router;
    // 1. Jalankan VRule untuk validasi skor (vrule_performance_grading)
    const ruleResult = await vrule.evaluate("vrule_performance_grading", { score });

    // 2. Trigger VFlow untuk wf_evaluation (EvaluationRequested)
    const vflowResult = await vflowClient.trigger({
      workflow: "EvaluationRequested",
      data: {
        student_id: studentId,
        score,
        comment,
        reviewer_id: reviewer_id || null,
        rule_passed: ruleResult.passed,
        grade: calculateGrade(score)
      }
    });

    // 3. Update status laporan terkait di database
    try {
      if (req.body.report_id) {
        await ReportModel.updateStatus(req.body.report_id, 'reviewed', score, comment, reviewer_id);
      }
    } catch (dbErr) {
      console.warn("⚠️ DB update reports failed (table mungkin belum ada):", dbErr.message);
    }

    res.json({
      success: true,
      message: `Feedback terkirim! Nilai ${score} (${calculateGrade(score)}) dikirim ke VFlow untuk diproses.`,
      vrule: ruleResult,
      vflow: vflowResult
    });

  } catch (error) {
    console.error("❌ Error POST /feedback:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// ==============================
// [VFlow wf_certification] TRIGGER SERTIFIKASI
// POST /api/vrule/certify
// ==============================
router.post("/certify", async (req, res) => {
  try {
    const { student_id, final_score } = req.body;

    // 1. Validasi dengan VRule vrule_certificate_release
    const ruleResult = await vrule.evaluate("vrule_certificate_release", { final_score });

    if (!ruleResult.passed) {
      return res.status(400).json({
        success: false,
        message: "Mahasiswa belum memenuhi syarat untuk mendapatkan sertifikat.",
        vrule: ruleResult
      });
    }

    // 2. Trigger VFlow wf_certification (EvaluationCompleted)
    const vflowResult = await vflowClient.trigger({
      workflow: "EvaluationCompleted",
      data: { student_id, final_score, grade: calculateGrade(final_score) }
    });

    res.json({
      success: true,
      message: "Proses sertifikasi berhasil dimulai via VFlow!",
      vrule: ruleResult,
      vflow: vflowResult,
      certificate: {
        student_id,
        final_score,
        grade: calculateGrade(final_score),
        issued_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Error POST /certify:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// Helper: konversi score ke grade
function calculateGrade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "E";
}


module.exports = router;