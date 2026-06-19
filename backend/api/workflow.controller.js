const express = require("express");
const router = express.Router();
const workflow = require("../services/workflow.service");

router.get("/list", async (req, res) => {
    const result = await workflow.list();
    res.json(result);
});

router.post("/trigger", async (req, res) => {
    const { name, payload } = req.body;
    const result = await workflow.trigger(name, payload);
    res.json(result);
});

module.exports = router;