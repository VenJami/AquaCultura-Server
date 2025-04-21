/**
 * Test script for task generation
 *
 * This script helps verify that the automatic task generation is working correctly.
 * It performs these steps:
 * 1. Creates a common task specifically for today's day of week
 * 2. Runs the daily task generator
 * 3. Verifies that tasks were properly created
 *
 * Usage: npm run test-generation
 */

const mongoose = require("mongoose");
const CommonTask = require("../models/commonTask.model");
const commonTaskController = require("../controllers/commonTask.controller");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/jencap")
  .then(() => {
    console.log("Connected to MongoDB");
    testTaskGeneration();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

async function testTaskGeneration() {
  try {
    // Get current day of week (0=Sunday, 1=Monday, etc.)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    console.log("===== TASK GENERATION TEST =====");
    console.log(
      `Creating a test common task for today (${dayNames[dayOfWeek]}, day ${dayOfWeek})`
    );

    // Create a common task for today's day of week
    const commonTaskData = {
      title: `Test Task for ${dayNames[dayOfWeek]}`,
      description: `This is a test task created for ${dayNames[dayOfWeek]}`,
      priority: "medium",
      repeatPattern: {
        type: "weekly",
        days: [dayOfWeek], // Use today's day of week
      },
      startDate: new Date(),
      createdBy: "000000000000000000000000", // Dummy ObjectId
      active: true,
      autoGenerateTasks: true,
    };

    // Create the common task
    const commonTask = new CommonTask(commonTaskData);
    const savedTask = await commonTask.save();

    console.log(`Created test common task: ${savedTask._id}`);
    console.log(`Repeat pattern: ${JSON.stringify(savedTask.repeatPattern)}`);

    // Wait a moment for database to update
    console.log("Waiting for database to update...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Run the task generator
    console.log("\n===== RUNNING DAILY TASK GENERATOR =====");
    const result = await commonTaskController.generateDailyTasks();

    // Verify results
    console.log("\n===== TASK GENERATION RESULTS =====");
    if (result.success) {
      console.log(`✓ Generated ${result.tasksCount} tasks successfully!`);

      // Output generated tasks by common task
      if (result.tasksByCommonTask) {
        Object.entries(result.tasksByCommonTask).forEach(
          ([commonTaskId, tasks]) => {
            console.log(
              `✓ Common Task ${commonTaskId}: ${tasks.length} tasks created`
            );

            // Log our test task creation if it was processed
            if (commonTaskId === savedTask._id.toString()) {
              console.log(`  ✓ Our test task was successfully processed!`);
            }
          }
        );
      }

      // Clean up test common task
      console.log("\n===== CLEANUP =====");
      try {
        await CommonTask.deleteOne({ _id: savedTask._id });
        console.log(`✓ Test common task deleted successfully`);
      } catch (cleanupError) {
        console.error("Error deleting test common task:", cleanupError);
      }
    } else {
      console.error("✗ Task generation failed:", result.error);
    }

    console.log("\n===== TEST COMPLETED =====");
  } catch (error) {
    console.error("✗ Test error:", error);
  } finally {
    // Disconnect from MongoDB
    try {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB");
    } catch (disconnectError) {
      console.error("Error disconnecting from MongoDB:", disconnectError);
    }
  }
}
