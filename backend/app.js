const path = require("path");
require("dotenv").config({ path: path.join(__dirname, '.env') });

const express = require("express");
const cors = require("cors");
const db = require("./integrations/database.client");
const vflow = require("./integrations/vflow.client");

const app = express();

// ─── MIDDLEWARE ─────────────────────
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
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
const pembimbingRoutes = require("./api/pembimbing.controller");
const perusahaanRoutes = require("./api/perusahaan.controller");
const dashboardRoutes = require("./api/dashboard.controller");
const reportRoutes = require("./api/report.controller");


app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/internship", internshipRoutes);
app.use("/api/internship/pembimbing", pembimbingRoutes);
app.use("/api/perusahaan", perusahaanRoutes);
app.use("/api/workflow", workflowRoutes);
app.use("/api/vrule", vruleRoutes);
app.use("/api/starlark", starlarkRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/reports", reportRoutes);

// health check
app.get("/health", async (req, res) => {
    let dbStatus = "unknown";

    try {
        await db.get("SELECT 1 AS ok");
        dbStatus = "postgres:connected";
    } catch (error) {
        dbStatus = `postgres:error:${error.message}`;
    }

    res.json({
        status: "OK",
        service: "Smart Internship Backend",
        database: dbStatus,
        vflow: {
            enabled: vflow.config.enabled,
            mode: vflow.config.mode,
            baseUrl: vflow.config.baseUrl,
            namespace: vflow.config.namespace,
            registrationPath: vflow.config.paths.registration,
        }
    });
});

app.get("/api/vflow/health", async (req, res) => {
    try {
        const data = await vflow.health();
        res.json({ success: true, data });
    } catch (error) {
        res.status(502).json({
            success: false,
            message: error.message
        });
    }
});

app.get("/api/vflow/routes", async (req, res) => {
    try {
        const routes = await vflow.listKelompokRoutes();

        res.json({
            success: true,
            namespace: vflow.config.namespace,
            data: routes
        });
    } catch (error) {
        res.status(502).json({
            success: false,
            message: error.message
        });
    }
});

app.post("/api/vflow/register-test", async (req, res) => {
    try {
        const result = await vflow.triggerRegisterTest(req.body || {});
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(502).json({
            success: false,
            message: error.message,
            detail: error.responseData || null
        });
    }
});

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        await db.initSchema();

        app.listen(PORT, () => {
            console.log(`Backend running on port ${PORT}`);
            console.log(`VFlow mode: ${vflow.config.mode} (${vflow.config.baseUrl})`);
        });
    } catch (error) {
        console.error("Failed to start backend:", error.message);
        process.exit(1);
    }
}

start();