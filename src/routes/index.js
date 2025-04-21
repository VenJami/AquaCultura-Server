const express = require("express");
const router = express.Router();
const authRoutes = require("./auth");
const userRoutes = require("./users");
const teamRoutes = require("./teams");
const commonTaskRoutes = require("./commonTask.routes");
const taskRoutes = require("./tasks");

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/teams", teamRoutes);
router.use("/common-tasks", commonTaskRoutes);
router.use("/tasks", taskRoutes);

module.exports = router;
