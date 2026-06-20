const express = require("express");
const router = express.Router();
const nats = require("../services/nats.service");

router.post("/publish", async (req, res) => {
    const { topic, message } = req.body;
    await nats.publish(topic, message);
    res.json({ status: "published" });
});

module.exports = router;