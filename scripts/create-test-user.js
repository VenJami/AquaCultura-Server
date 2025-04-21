const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define User model (simplified version for this script)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now },
  schedule: String,
  tasks: [
    {
      title: String,
      description: String,
      startDate: Date,
      dueDate: Date,
      status: Boolean,
    },
  ],
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model("User", userSchema);

// Create test user
async function createOrUpdateTestUser() {
  try {
    // Test user credentials
    const testCredentials = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: "user",
    };

    // Check if test user already exists
    const existingUser = await User.findOne({ email: testCredentials.email });

    if (existingUser) {
      console.log("Test user already exists. Updating password...");

      // Update the password and schedule
      existingUser.password = testCredentials.password;
      existingUser.schedule = "9:30 AM - 5:30 PM"; // Set a custom schedule

      // Add sample tasks
      existingUser.tasks = [
        {
          title: "Check water pH levels",
          description:
            "Measure and record the pH levels in all aquaculture tanks",
          startDate: new Date(),
          dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
          status: false,
        },
        {
          title: "Feed fish in Tank A",
          description: "Use the appropriate feed for the current growth stage",
          startDate: new Date(),
          dueDate: new Date(new Date().setHours(new Date().getHours() + 3)),
          status: true,
        },
        {
          title: "Clean filters",
          description: "Clean all water filters and replace as needed",
          startDate: new Date(new Date().setDate(new Date().getDate() - 1)),
          dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
          status: false,
        },
      ];

      await existingUser.save();

      console.log("Test user password and schedule updated successfully");
      console.log("-----------------------------------");
      console.log("TEST USER CREDENTIALS:");
      console.log("Email: " + testCredentials.email);
      console.log("Password: " + testCredentials.password);
      console.log("Schedule: 9:30 AM - 5:30 PM");
      console.log("-----------------------------------");
    } else {
      // Create new test user
      const testUser = new User({
        ...testCredentials,
        schedule: "9:30 AM - 5:30 PM", // Set a custom schedule
        tasks: [
          {
            title: "Check water pH levels",
            description:
              "Measure and record the pH levels in all aquaculture tanks",
            startDate: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
            status: false,
          },
          {
            title: "Feed fish in Tank A",
            description:
              "Use the appropriate feed for the current growth stage",
            startDate: new Date(),
            dueDate: new Date(new Date().setHours(new Date().getHours() + 3)),
            status: true,
          },
          {
            title: "Clean filters",
            description: "Clean all water filters and replace as needed",
            startDate: new Date(new Date().setDate(new Date().getDate() - 1)),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
            status: false,
          },
        ],
      });
      await testUser.save();

      console.log("Test user created successfully");
      console.log("-----------------------------------");
      console.log("TEST USER CREDENTIALS:");
      console.log("Email: " + testCredentials.email);
      console.log("Password: " + testCredentials.password);
      console.log("Schedule: 9:30 AM - 5:30 PM");
      console.log("-----------------------------------");
    }
  } catch (error) {
    console.error("Error creating/updating test user:", error);
  } finally {
    mongoose.disconnect();
  }
}

createOrUpdateTestUser();
