require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// ─── MIDDLEWARE ─────────────────────
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

// ─── ROUTES ─────────────────────────
const internshipRoutes = require("./api/internship.controller");
const workflowRoutes = require("./api/workflow.controller");
const vruleRoutes = require("./api/vrule.controller");
const starlarkRoutes = require("./api/starlark.controller");
const eventRoutes = require("./api/event.controller");
const authRoutes = require("./api/auth.controller");

app.use("/api/auth", authRoutes);
app.use("/api/internship", internshipRoutes);
app.use("/api/workflow", workflowRoutes);
app.use("/api/vrule", vruleRoutes);
app.use("/api/starlark", starlarkRoutes);
app.use("/api/event", eventRoutes);

// health check
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        service: "Smart Internship Backend"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});