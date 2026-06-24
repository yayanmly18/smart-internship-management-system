const express = require("express");
const router = express.Router();

const starlark = require("../engine/starlark.engine");
const vrule = require("../services/vrule.service");
const workflow = require("../services/workflow.service");
const nats = require("../services/nats.service");
const audit = require("../services/audit.service");

// ==============================
// REGISTER (SUDAH ADA - DIPERTAHANKAN)
// ==============================
router.post("/register", async (req, res) => {
    const data = req.body;

    const eligibility = starlark.executeEligibility(data);
    const rule = await vrule.evaluate("vrule_eligibility_check", eligibility);
    const flow = await workflow.trigger("wf_registration", data);

    await nats.publish("InternshipSubmitted", data);
    await audit.log({ action: "REGISTER", data });

    res.json({
        success: true,
        message: "Internship processed successfully",
        data: {
            eligibility,
            rule,
            workflow: flow
        }
    });
});


// ==============================
// 🔥 TAMBAHAN: STATUS (SUPAYA FRONTEND CONNECT DASHBOARD)
// ==============================
router.get("/status", async (req, res) => {
    const { role } = req.query;

    res.json({
        role: role || "mahasiswa",
        status: "aktif",
        progress: 68,
        message: "Status retrieved successfully"
    });
});
router.get("/status", async (req, res) => {
    const { role } = req.query;

    res.json({
        role,
        stats: {
            total: 48,
            aktif: 32,
            selesai: 5
        }
    });
});

module.exports = router;ships.filter(i => i.status === 'selesai').length,
      seleksi: allInternships.filter(i => i.status === 'seleksi').length,
    };
    return res.json({ role: role || 'admin', stats });

  } catch (err) {
    console.error("❌ Error GET /status:", err);
    res.status(500).json({ message: "Gagal ambil data status.", error: err.message });
  }
});


// ==============================
// [DB] AMBIL DAFTAR MAHASISWA (untuk pembimbing & admin)
// GET /api/internship/students
// ==============================
router.get("/students", async (req, res) => {
  try {
    const students = await InternshipModel.findAll();
    res.json({ success: true, data: students });
  } catch (err) {
    console.error("❌ Error GET /students:", err);
    res.status(500).json({ message: "Gagal ambil data mahasiswa.", error: err.message });
  }
});


// ==============================
// [VFlow wf_monitoring] SUBMIT LAPORAN MINGGUAN
// POST /api/internship/upload-report
// ==============================
router.post("/upload-report", async (req, res) => {
  try {
    const { user_id, week, filename } = req.body;

    if (!user_id || !week) {
      return res.status(400).json({ message: "user_id dan week wajib diisi." });
    }

    // 1. Trigger VFlow untuk wf_monitoring (ProgressSubmitted event)
    const vflowResult = await vflowClient.trigger({
      workflow: "ProgressSubmitted",
      data: { user_id, week, filename: filename || `laporan_minggu_${week}.pdf` }
    });

    // 2. Simpan laporan ke database dengan referensi vflow_execution_id
    let savedReport = null;
    try {
      savedReport = await ReportModel.create({
        user_id,
        week,
        filename: filename || `laporan_minggu_${week}.pdf`,
        vflow_execution_id: vflowResult?.executionId || null
      });
    } catch (dbErr) {
      console.warn("⚠️ DB save failed (table mungkin belum ada), VFlow tetap berjalan:", dbErr.message);
    }

    res.json({
      success: true,
      message: `Laporan minggu ke-${week} berhasil dikirim ke VFlow untuk divalidasi.`,
      vflow: vflowResult,
      report: savedReport
    });
  } catch (error) {
    console.error("❌ Error upload-report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// ==============================
// [DB] AMBIL RIWAYAT LAPORAN USER
// GET /api/internship/reports?user_id=xxx
// ==============================
router.get("/reports", async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ message: "user_id wajib diisi." });

  try {
    const reports = await ReportModel.findByUserId(user_id);
    res.json({ success: true, data: reports });
  } catch (err) {
    console.error("❌ Error GET /reports:", err);
    // Jika tabel belum ada, kembalikan array kosong agar frontend tidak crash
    res.json({ success: true, data: [], message: "Tabel reports belum ada atau belum ada data." });
  }
});


module.exports = router;