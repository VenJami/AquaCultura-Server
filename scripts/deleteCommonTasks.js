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

// Define the CommonTask model schema
const commonTaskSchema = new mongoose.Schema({}, { strict: false });
const CommonTask = mongoose.model("CommonTask", commonTaskSchema);

async function deleteCommonTasks() {
  try {
    // Delete all common tasks
    const result = await CommonTask.deleteMany({});
    console.log(`Deleted ${result.deletedCount} common tasks`);

    console.log("Common task data deleted successfully");
  } catch (error) {
    console.error("Error deleting common tasks:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
}

// Execute the function
deleteCommonTasks();
