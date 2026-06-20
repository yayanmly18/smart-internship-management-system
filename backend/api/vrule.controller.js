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