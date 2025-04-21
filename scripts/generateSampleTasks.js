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

// Define the Task and CommonTask model schemas
const taskSchema = new mongoose.Schema({}, { strict: false });
const commonTaskSchema = new mongoose.Schema({}, { strict: false });
const userSchema = new mongoose.Schema({}, { strict: false });

const Task = mongoose.model("Task", taskSchema);
const CommonTask = mongoose.model("CommonTask", commonTaskSchema);
const User = mongoose.model("User", userSchema);

async function generateSampleData() {
  try {
    // First find an admin user to use as creator
    const adminUser = await User.findOne({ role: "admin" });

    if (!adminUser) {
      console.log("No admin user found. Using fallback ID.");
    }

    const creatorId = adminUser ? adminUser._id : "000000000000000000000000";

    // Generate Common Tasks (task templates)
    const commonTasks = [
      {
        title: "Daily pH Level Check",
        description:
          "Check pH levels in all growing areas and record results in the log book",
        priority: "medium",
        repeatPattern: {
          type: "daily",
        },
        startDate: new Date(),
        createdBy: creatorId,
        active: true,
        autoGenerateTasks: true,
      },
      {
        title: "Weekly Equipment Inspection",
        description:
          "Thoroughly inspect all pumps, filters, and monitoring equipment",
        priority: "high",
        repeatPattern: {
          type: "weekly",
          days: [1], // Monday
        },
        startDate: new Date(),
        createdBy: creatorId,
        active: true,
        autoGenerateTasks: true,
      },
      {
        title: "Nutrient Addition",
        description:
          "Add nutrients to all growing areas according to the schedule",
        priority: "high",
        repeatPattern: {
          type: "weekly",
          days: [1, 3, 5], // Monday, Wednesday, Friday
        },
        startDate: new Date(),
        createdBy: creatorId,
        active: true,
        autoGenerateTasks: true,
      },
      {
        title: "Monthly Deep Cleaning",
        description: "Perform thorough cleaning of all systems and equipment",
        priority: "medium",
        repeatPattern: {
          type: "monthly",
          dayOfMonth: 1,
        },
        startDate: new Date(),
        createdBy: creatorId,
        active: true,
        autoGenerateTasks: true,
      },
      {
        title: "Quarterly System Audit",
        description:
          "Comprehensive audit of all systems, procedures, and documentation",
        priority: "high",
        repeatPattern: {
          type: "monthly",
          dayOfMonth: 15,
        },
        startDate: new Date(),
        createdBy: creatorId,
        active: true,
        autoGenerateTasks: false,
      },
    ];

    // Save common tasks
    const savedCommonTasks = [];
    for (const taskData of commonTasks) {
      const commonTask = new CommonTask(taskData);
      const saved = await commonTask.save();
      savedCommonTasks.push(saved);
      console.log(`Created common task: ${saved.title}`);
    }

    // Generate individual tasks
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const tasks = [
      {
        title: "Harvest Lettuce from Section A",
        description: "Harvest mature lettuce crops and prepare for packaging",
        priority: "High",
        status: "Pending",
        startDate: today,
        dueDate: tomorrow,
        assignee: creatorId,
        createdBy: creatorId,
      },
      {
        title: "Fix Water Leak in Zone 2",
        description:
          "Locate and repair water leak in the irrigation system in Zone 2",
        priority: "High",
        status: "In Progress",
        startDate: today,
        dueDate: today,
        assignee: creatorId,
        createdBy: creatorId,
      },
      {
        title: "Order New Nutrient Solutions",
        description:
          "Place order for next month's supply of nutrient solutions",
        priority: "Medium",
        status: "Pending",
        startDate: tomorrow,
        dueDate: nextWeek,
        assignee: creatorId,
        createdBy: creatorId,
      },
      {
        title: "Clean Nutrient Filters",
        description: "Remove and clean all nutrient filters in the main system",
        priority: "Medium",
        status: "Pending",
        startDate: today,
        dueDate: tomorrow,
        assignee: creatorId,
        createdBy: creatorId,
      },
      {
        title: "Staff Training Session",
        description: "Conduct training session on new monitoring equipment",
        priority: "Low",
        status: "Pending",
        startDate: nextWeek,
        dueDate: nextWeek,
        assignee: creatorId,
        createdBy: creatorId,
      },
    ];

    // Save individual tasks
    const savedTasks = [];
    for (const taskData of tasks) {
      const task = new Task(taskData);
      const saved = await task.save();
      savedTasks.push(saved);
      console.log(`Created task: ${saved.title}`);
    }

    // Generate tasks from common tasks for today
    console.log("\nGenerating tasks from common tasks for today...");
    const matchingCommonTasks = [];

    for (const commonTask of savedCommonTasks) {
      // Simple pattern matching logic for demo purposes
      const pattern = commonTask.repeatPattern;
      let matches = false;

      if (pattern.type === "daily") {
        matches = true;
      } else if (pattern.type === "weekly") {
        const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        matches = pattern.days.includes(day);
      } else if (pattern.type === "monthly") {
        const dayOfMonth = today.getDate();
        matches = dayOfMonth === pattern.dayOfMonth;
      }

      if (matches) {
        matchingCommonTasks.push(commonTask);

        // Create task from this common task
        const taskDueDate = new Date(today);
        taskDueDate.setHours(23, 59, 59);

        const taskData = {
          title: commonTask.title,
          description: commonTask.description,
          priority:
            commonTask.priority.charAt(0).toUpperCase() +
            commonTask.priority.slice(1),
          status: "Pending",
          startDate: today,
          dueDate: taskDueDate,
          assignee: creatorId,
          createdBy: creatorId,
          commonTaskId: commonTask._id,
          isGeneratedFromCommonTask: true,
        };

        const task = new Task(taskData);
        const saved = await task.save();
        console.log(`Generated task from common task: ${saved.title}`);
      }
    }

    console.log("\nSample data generation complete!");
    console.log(`Created ${savedCommonTasks.length} common tasks`);
    console.log(`Created ${savedTasks.length} individual tasks`);
    console.log(
      `Generated ${matchingCommonTasks.length} tasks from matching common tasks`
    );
  } catch (error) {
    console.error("Error generating sample data:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Execute the function
generateSampleData();
