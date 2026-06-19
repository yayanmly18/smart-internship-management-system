const express = require("express");
const router = express.Router();
const vrule = require("../services/vrule.service");

router.post("/evaluate", async (req, res) => {
    const { ruleId, data } = req.body;
    const result = await vrule.evaluate(ruleId, data);
    res.json(result);
});

module.exports = router;