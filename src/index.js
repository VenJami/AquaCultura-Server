const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/database");
const mongoose = require("mongoose");
// const cron = require("node-cron");
// const { commonTaskController } = require("./controllers");
require("dotenv").config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Configure CORS - Development mode (accept all origins)
app.use(cors());

// Middleware
app.use(express.json());
app.use(morgan("dev"));

// Root endpoint to test connectivity
app.get("/", (req, res) => {
  res.json({ message: "Welcome to AquaCultura API", status: "online" });
});

// API connectivity test endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "AquaCultura API is running",
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

// Import routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/seedlings", require("./routes/seedlings"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/teams", require("./routes/teams"));
app.use("/api/common-tasks", require("./routes/commonTask.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/events", require("./routes/event.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
// app.use('/api/transplants', require('./routes/transplants'));

// Set up daily task for recurring task generation
const taskGenerator = require("./schedulers/taskGenerator");

// Start the scheduler for task generation
taskGenerator.startScheduler();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
});
