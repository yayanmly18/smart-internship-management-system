const express = require('express');
const router = express.Router();
const AuditController = require('./audit.controller');

// URL Webhook buat ditembak sama VFlow
router.post('/webhook/vflow', AuditController.receiveVFlowLog);

module.exports = router;