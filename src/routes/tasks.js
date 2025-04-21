const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");
const { protect, authorize } = require("../middleware/auth");

// Apply authentication to all routes
router.use(protect);

// Get all tasks and task statistics (admin and superadmin only)
router.get("/", authorize("admin"), taskController.getAllTasks);
router.get("/stats", authorize("admin"), taskController.getTaskStats);

// Get tasks for the current user (all roles)
router.get("/my-tasks", taskController.getUserTasks);

// Get tasks for a specific user (admin and superadmin only)
router.get("/user/:userId", authorize("admin"), taskController.getUserTasks);

// Get task by ID
router.get("/:id", taskController.getTaskById);

// Create new task (admin and superadmin only)
router.post("/", authorize("admin"), taskController.createTask);

// Update task
router.put("/:id", taskController.updateTask);

// Delete task (admin and superadmin only)
router.delete("/:id", authorize("admin"), taskController.deleteTask);

module.exports = router;
