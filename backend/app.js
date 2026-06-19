const express = require("express");
const app = express();

const internshipRoutes = require("./api/internship.controller");
const workflowRoutes = require("./api/workflow.controller");
const vruleRoutes = require("./api/vrule.controller");
const starlarkRoutes = require("./api/starlark.controller");
const eventRoutes = require("./api/event.controller");

app.use(express.json());

app.use("/api/internship", internshipRoutes);
app.use("/api/workflow", workflowRoutes);
app.use("/api/vrule", vruleRoutes);
app.use("/api/starlark", starlarkRoutes);
app.use("/api/event", eventRoutes);

app.listen(3000, () => {
    console.log("Backend running on port 3000");
});