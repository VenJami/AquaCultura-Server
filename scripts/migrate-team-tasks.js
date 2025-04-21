/**
 * Migration script to update existing team tasks
 *
 * This script finds all tasks with "[TEAM TASK]" in the description
 * and sets the isTeamTask field to true.
 *
 * Usage:
 * 1. Make sure MongoDB is running
 * 2. Run: node scripts/migrate-team-tasks.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Task = require("../src/models/task");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

async function migrateTeamTasks() {
  try {
    console.log("Starting team tasks migration...");

    // Find all tasks with "[TEAM TASK]" in description
    const tasks = await Task.find({
      description: { $regex: "\\[TEAM TASK\\]", $options: "i" },
      isTeamTask: { $ne: true }, // Only update those not already marked
    });

    console.log(`Found ${tasks.length} tasks to migrate`);

    // Update all matching tasks
    if (tasks.length > 0) {
      const updateResults = await Task.updateMany(
        { description: { $regex: "\\[TEAM TASK\\]", $options: "i" } },
        { $set: { isTeamTask: true } }
      );

      console.log(`Updated ${updateResults.modifiedCount} tasks`);
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the migration
migrateTeamTasks();
