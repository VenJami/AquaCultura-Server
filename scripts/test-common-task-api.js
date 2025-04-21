const axios = require("axios");
require("dotenv").config();
const mongoose = require("mongoose");

const BASE_URL = `http://localhost:${process.env.PORT || 3000}/api`;
let authToken = "";
// Create a valid MongoDB ObjectId
const ADMIN_ID = "64f12f4307aa60af488d9a1c"; // Replace with a valid admin ID or use the generated one below

// Function to log in and get token
const login = async () => {
  try {
    console.log("Attempting to log in with admin credentials...");
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@example.com",
      password: "admin123",
    });

    authToken = response.data.token;
    console.log("Login successful, token acquired");
    return true;
  } catch (err) {
    console.error("Login failed:", err.response?.data?.message || err.message);
    return false;
  }
};

// Function to create a common task with team assignees
const createCommonTask = async () => {
  try {
    console.log("\nCreating a new common task...");

    // Define the common task data
    const taskData = {
      title: "Weekly Water Testing",
      description: "Test water quality in all growing areas",
      priority: "medium",
      repeatPattern: {
        type: "weekly",
        days: [1, 3, 5], // Monday, Wednesday, Friday
      },
      startDate: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
      dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
      isTeamTask: true,
      team: "Maintenance Team",
      assigneeIds: JSON.stringify(["64f12f4307aa60af488d9a1c"]), // Use valid MongoDB ObjectId or the admin ID
      assigneeNames: JSON.stringify(["Admin User"]),
      assignedTo: ADMIN_ID,
      // We don't include createdBy as the controller will use req.user._id
      autoGenerateTasks: false,
    };

    console.log("Sending task data:", JSON.stringify(taskData, null, 2));

    const response = await axios.post(`${BASE_URL}/common-tasks`, taskData, {
      headers: {
        "x-auth-token": authToken,
        "Content-Type": "application/json",
      },
    });

    console.log("Common task created successfully!");
    console.log("Full response data:", JSON.stringify(response.data, null, 2));

    // The API may return the data in a different format, e.g., { data: { ... } }
    const taskResult = response.data.data || response.data;

    if (taskResult) {
      console.log(`- Title: ${taskResult.title}`);
      console.log(`- ID: ${taskResult._id}`);
      console.log(`- Team Task: ${taskResult.isTeamTask ? "Yes" : "No"}`);

      if (taskResult.isTeamTask) {
        console.log(`- AssigneeIds: ${taskResult.assigneeIds}`);
        console.log(`- Team: ${taskResult.team}`);
      }
    }

    return taskResult;
  } catch (err) {
    console.error(
      "Error creating common task:",
      err.response?.data?.message || err.message
    );

    // Log more details if available
    if (err.response?.data) {
      console.error(
        "Error details:",
        JSON.stringify(err.response.data, null, 2)
      );
    }

    return null;
  }
};

// Function to get all common tasks
const getAllCommonTasks = async () => {
  try {
    console.log("\nGetting all common tasks...");
    const response = await axios.get(`${BASE_URL}/common-tasks`, {
      headers: { "x-auth-token": authToken },
    });

    console.log("Full response data:", JSON.stringify(response.data, null, 2));

    // Handle different response formats
    const tasksData = response.data.data || response.data;

    if (Array.isArray(tasksData)) {
      console.log(`Retrieved ${tasksData.length} common tasks:`);
      tasksData.forEach((task) => {
        console.log(`- ${task.title} (ID: ${task._id})`);
      });
      return tasksData;
    } else {
      console.log("Response was not an array. Format:", typeof tasksData);
      return [];
    }
  } catch (err) {
    console.error(
      "Error getting common tasks:",
      err.response?.data?.message || err.message
    );
    return [];
  }
};

// Main function to run all tests
const runTests = async () => {
  console.log("Starting Common Task API tests...");

  // Try to log in first
  const loggedIn = await login();
  if (!loggedIn) {
    console.log("Cannot proceed with tests without authentication");
    return;
  }

  // Create a new common task
  const createdTask = await createCommonTask();

  // Get all common tasks
  if (createdTask) {
    await getAllCommonTasks();
  }

  console.log("\nCommon Task API tests completed");
};

// Run the tests
runTests().catch((err) => {
  console.error("Unhandled error during tests:", err);
});
