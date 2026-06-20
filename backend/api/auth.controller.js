const express = require("express");
const router = express.Router();

// dummy user store (sementara)
const users = [];

router.post("/login", (req, res) => {
    const { email, password, role } = req.body;

    const user = users.find(u =>
        u.email === email &&
        u.password === password &&
        u.role === role
    );

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Login gagal"
        });
    }

    res.json({
        success: true,
        message: "Login berhasil",
        data: user
    });
});

router.post("/register", (req, res) => {
    const user = req.body;

    users.push(user);

    res.json({
        success: true,
        message: "Register berhasil",
        data: user
    });
});

module.exports = router;