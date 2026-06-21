const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');

// Rute untuk Register mahasiswa baru
router.post('/register', AuthController.register);

// Rute untuk Login
router.post('/login', AuthController.login);

module.exports = router; // Pastikan yang diexport adalah router-nya