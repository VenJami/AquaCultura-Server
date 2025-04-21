const express = require("express");
const commonTaskController = require("../controllers/commonTask.controller");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware
router.use(protect);

// Only admin and manager can access these routes
router.use(authorize("admin", "manager"));

// CRUD routes for common tasks
router.get("/", commonTaskController.getAllCommonTasks);
router.get("/:id", commonTaskController.getCommonTaskById);
router.post("/", commonTaskController.createCommonTask);
router.put("/:id", commonTaskController.updateCommonTask);
router.delete("/:id", commonTaskController.deleteCommonTask);

// Task generation routes
router.post(
  "/:id/generate-tasks",
  commonTaskController.generateTasksFromSpecificCommonTask
);
router.post("/:id/create-task", commonTaskController.createTaskFromCommonTask);
router.post("/generate-daily-tasks", commonTaskController.generateDailyTasks);

// TEST endpoint for manual testing - keep in development, remove in production
if (process.env.NODE_ENV !== "production") {
  router.post("/run-daily-generation", async (req, res) => {
    console.log("Manually triggering daily task generation...");
    try {
      const result = await commonTaskController.generateDailyTasks(req, res);
      // If result is returned directly (not through res), send it as response
      if (result && !res.headersSent) {
        return res.status(200).json({
          message: "Daily task generation completed",
          result,
        });
      }
    } catch (error) {
      console.error("Error in manual task generation:", error);
      if (!res.headersSent) {
        return res.status(500).json({
          message: "Failed to run daily task generation",
          error: error.message,
        });
      }
    }
  });
}

module.exports = router;
