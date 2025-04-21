const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { generateUpcomingTasks } = require("../utils/taskScheduler");
const commonTaskController = require("../controllers/commonTask.controller");

const router = express.Router();

// Protect all routes
router.use(protect);

// Only admins can access these routes
router.use(authorize("admin"));

/**
 * @route   POST /api/admin/generate-tasks
 * @desc    Manually trigger task generation for recurring tasks
 * @access  Admin
 */
router.post("/generate-tasks", async (req, res) => {
  try {
    const result = await generateUpcomingTasks();

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Successfully generated ${result.tasksGenerated} tasks`,
        data: result,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to generate tasks",
        error: result.error,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error generating tasks",
      error: error.message,
    });
  }
});

// Manually trigger daily task generation (for testing)
router.post("/generate-today-tasks", commonTaskController.generateDailyTasks);

module.exports = router;
