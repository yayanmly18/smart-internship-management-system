const express = require("express");
const router = express.Router();
const vrule = require("../services/vrule.service");
const db = require("../integrations/database.client");
const authMiddleware = require("../middleware/auth.middleware");

// ==============================
// EVALUATE RULE 
// ==============================
router.post("/evaluate", async (req, res) => {
    const { ruleId, data } = req.body;
    const result = await vrule.evaluate(ruleId, data);
    res.json(result);
});

// ==============================
// FEEDBACK - Save to DB & trigger evaluation
// ==============================
router.post("/feedback", authMiddleware, async (req, res) => {
    try {
        const { studentId, internshipId, score, comment } = req.body;

        if (!studentId) {
            return res.status(400).json({ success: false, message: "studentId diperlukan" });
        }
        if (score === undefined || score === null) {
            return res.status(400).json({ success: false, message: "score diperlukan" });
        }

        // Save feedback to DB
        const result = await db.run(
            'INSERT INTO feedbacks (student_id, internship_id, score, comment) VALUES (?,?,?,?)',
            [String(studentId), internshipId || null, Number(score), comment || null]
        );

        // Check progress compliance after feedback
        if (internshipId) {
            await vrule.evaluate('vrule_progress_compliance', { internshipId });
        }

        res.json({
            success: true,
            message: "Feedback tersimpan",
            data: {
                id: result.id,
                studentId,
                score,
                comment: comment || null
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;