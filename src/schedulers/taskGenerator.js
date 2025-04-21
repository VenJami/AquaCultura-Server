const cron = require("node-cron");
const commonTaskController = require("../controllers/commonTask.controller");

/**
 * Task Scheduler for Common Task Generation
 *
 * This module sets up a scheduled job to generate tasks from common tasks
 * that have auto-generation enabled. It runs once per day at 7:00 AM.
 *
 * The scheduler uses node-cron to manage the scheduling. The format is:
 * second(0-59) minute(0-59) hour(0-23) day(1-31) month(1-12) weekday(0-6)(Sunday-Saturday)
 */

// Set up daily task generation at 7:00 AM
const dailyTaskGenerator = cron.schedule(
  "0 7 * * *",
  async () => {
    console.log("==================================================");
    console.log("Running daily task generation...");
    const date = new Date();
    console.log(`Current time: ${date.toISOString()}`);
    console.log(`Day of week: ${date.getDay()} (${getDayName(date.getDay())})`);

    try {
      // Call the generator without request/response objects
      const result = await commonTaskController.generateDailyTasks();

      if (result.success) {
        console.log(
          `Daily task generation completed successfully: ${result.tasksCount} tasks generated`
        );

        // Log details about which common tasks had tasks generated for them
        if (result.tasksByCommonTask) {
          for (const [commonTaskId, tasks] of Object.entries(
            result.tasksByCommonTask
          )) {
            console.log(
              `- Common Task ${commonTaskId}: ${tasks.length} tasks created`
            );
          }
        }
      } else {
        console.error(`Daily task generation failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error running daily task generation:", error);
    }
    console.log("==================================================");
  },
  {
    scheduled: true,
    timezone: "UTC", // Adjust timezone as needed
  }
);

// Helper function to get day name
function getDayName(dayIndex) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayIndex];
}

// Method to start the scheduler
function startScheduler() {
  dailyTaskGenerator.start();
  console.log("Task generation scheduler started");
}

// Method to stop the scheduler
function stopScheduler() {
  dailyTaskGenerator.stop();
  console.log("Task generation scheduler stopped");
}

module.exports = {
  startScheduler,
  stopScheduler,
  dailyTaskGenerator,
};
