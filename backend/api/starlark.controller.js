const express = require("express");
const router = express.Router();
const starlark = require("../services/starlark.service");

router.post("/eligibility", (req, res) => {
    const result = starlark.calculateEligibility(req.body);
    res.json(result);
});

router.post("/grading", (req, res) => {
    const result = starlark.calculateFinalScore(req.body);
    res.json(result);
});

module.exports = router;