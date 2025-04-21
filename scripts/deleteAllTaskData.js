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

const Task = mongoose.model("Task", taskSchema);
const CommonTask = mongoose.model("CommonTask", commonTaskSchema);

async function deleteAllTaskData() {
  try {
    // Delete all tasks
    const tasksResult = await Task.deleteMany({});
    console.log(`Deleted ${tasksResult.deletedCount} tasks`);

    // Delete all common tasks
    const commonTasksResult = await CommonTask.deleteMany({});
    console.log(`Deleted ${commonTasksResult.deletedCount} common tasks`);

    console.log("All task data deleted successfully");
  } catch (error) {
    console.error("Error deleting task data:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
}

// Execute the function
deleteAllTaskData();
