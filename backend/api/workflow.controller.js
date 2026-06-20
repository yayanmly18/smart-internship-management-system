const express = require("express");
const router = express.Router();
const workflow = require("../services/workflow.service");

// ==============================
// LIST WORKFLOW (SUDAH ADA)
// ==============================
router.get("/list", async (req, res) => {
    const result = await workflow.list();
    res.json(result);
});


// ==============================
// TRIGGER WORKFLOW (SUDAH ADA)
// ==============================
router.post("/trigger", async (req, res) => {
    const { name, payload } = req.body;
    const result = await workflow.trigger(name, payload);
    res.json(result);
});


// ==============================
// 🔥 TAMBAHAN: UPLOAD REPORT (BIAR MATCH FRONTEND)
// ==============================
router.post("/upload", async (req, res) => {
    const { week } = req.body;

    await workflow.trigger("wf_upload_report", req.body);

    res.json({
        success: true,
        message: "Report uploaded successfully",
        week: week
    });

router.post("/upload", async (req, res) => {
    const { week } = req.body;

    res.json({
        success: true,
        message: `Laporan minggu ${week} diterima`,
        file: "mock-file.pdf"
    });
});
});

module.exports = router;