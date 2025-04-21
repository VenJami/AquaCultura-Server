const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });

// Define the Task model schema
const taskSchema = new mongoose.Schema({}, { strict: false });
const Task = mongoose.model("Task", taskSchema);

async function deleteTasks() {
  try {
    // Delete all tasks
    const result = await Task.deleteMany({});
    console.log(`Deleted ${result.deletedCount} tasks`);

    console.log("Task data deleted successfully");
  } catch (error) {
    console.error("Error deleting tasks:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
}

// Execute the function
deleteTasks();
