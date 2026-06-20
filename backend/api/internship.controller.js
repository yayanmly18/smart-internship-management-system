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

module.exports = router;