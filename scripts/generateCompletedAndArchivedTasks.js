const mongoose = require("mongoose");
// Hardcode the connection string from .env since dotenv is not loading properly
const MONGODB_URI =
  "mongodb+srv://jenneypandacan22:042522@aquacultura.l1k9mld.mongodb.net/?retryWrites=true&w=majority&appName=AquaCultura";

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });

// Define the Task and User model schemas
const taskSchema = new mongoose.Schema({}, { strict: false });
const userSchema = new mongoose.Schema({}, { strict: false });

const Task = mongoose.model("Task", taskSchema);
const User = mongoose.model("User", userSchema);

async function generateArchiveAndCompletedTasks() {
  try {
    // First find an admin user to use as creator
    const adminUser = await User.findOne({ role: "admin" });

    if (!adminUser) {
      console.log("No admin user found. Using fallback ID.");
    }

    const creatorId = adminUser ? adminUser._id : "000000000000000000000000";

    const today = new Date();

    // Create yesterday date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Create dates for different completed tasks
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const tasks = [
      // 1. Completed tasks from today
      {
        title: "Today's Completed Task - Water Testing",
        description: "Complete water quality testing for all grow beds",
        priority: "Medium",
        status: "Completed",
        startDate: today,
        dueDate: today,
        assignee: creatorId,
        createdBy: creatorId,
        completedAt: today,
      },
      {
        title: "Today's Completed Task - System Check",
        description: "Perform daily system check of all grow areas",
        priority: "High",
        status: "Completed",
        startDate: today,
        dueDate: today,
        assignee: creatorId,
        createdBy: creatorId,
        completedAt: today,
      },

      // 2. Completed tasks from yesterday (for archive)
      {
        title: "Yesterday's Completed Task - Filter Cleaning",
        description: "Clean all filters in the main system",
        priority: "Medium",
        status: "Completed",
        startDate: yesterday,
        dueDate: yesterday,
        assignee: creatorId,
        createdBy: creatorId,
        completedAt: yesterday,
      },
      {
        title: "Yesterday's Completed Task - Harvest Tomatoes",
        description: "Harvest ripe tomatoes from Section C",
        priority: "Medium",
        status: "Completed",
        startDate: yesterday,
        dueDate: yesterday,
        assignee: creatorId,
        createdBy: creatorId,
        completedAt: yesterday,
      },

      // 3. Completed tasks from earlier (for archive)
      {
        title: "Last Week's Completed Task - Pump Maintenance",
        description: "Perform maintenance on all water pumps",
        priority: "High",
        status: "Completed",
        startDate: lastWeek,
        dueDate: lastWeek,
        assignee: creatorId,
        createdBy: creatorId,
        completedAt: lastWeek,
      },

      // 4. Overdue tasks (for archive)
      {
        title: "Overdue Task - System Upgrade",
        description: "Install upgraded monitoring system",
        priority: "High",
        status: "Overdue",
        startDate: lastWeek,
        dueDate: twoDaysAgo,
        assignee: creatorId,
        createdBy: creatorId,
      },

      // 5. Pending tasks with past due dates (for archive)
      {
        title: "Past Due Pending Task - Replace UV Filter",
        description: "Replace UV filter in water treatment system",
        priority: "Medium",
        status: "Pending",
        startDate: twoDaysAgo,
        dueDate: yesterday,
        assignee: creatorId,
        createdBy: creatorId,
      },

      // 6. In Progress tasks with past due dates (for archive)
      {
        title: "Past Due In Progress Task - Equipment Order",
        description: "Complete order for new equipment parts",
        priority: "Low",
        status: "In Progress",
        startDate: twoDaysAgo,
        dueDate: yesterday,
        assignee: creatorId,
        createdBy: creatorId,
      },
    ];

    // Save individual tasks
    for (const taskData of tasks) {
      const task = new Task(taskData);
      const saved = await task.save();
      console.log(
        `Created task: ${saved.title} (Status: ${
          saved.status
        }, Due: ${saved.dueDate.toDateString()})`
      );
    }

    console.log("\nTasks generation complete!");
    console.log(`Created ${tasks.length} tasks for today and archive`);
  } catch (error) {
    console.error("Error generating sample data:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Execute the function
generateArchiveAndCompletedTasks();
