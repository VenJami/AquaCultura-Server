require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const User = require("../src/models/user");

// Default admin credentials - change these before running in production
const adminUser = {
  name: "Admin User",
  email: "admin@example.com",
  password: "admin123",
  role: "admin",
};

// MongoDB connection URI from .env file
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://jenneypandacan22:042522@aquacultura.l1k9mld.mongodb.net/?retryWrites=true&w=majority&appName=AquaCultura";

console.log("Connecting to MongoDB...");
console.log("MongoDB URI:", MONGODB_URI);

// Connect to the database
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to the database successfully");

    try {
      // Check if an admin user already exists
      const existingAdmin = await User.findOne({ role: "admin" });

      if (existingAdmin) {
        console.log("An admin user already exists:", existingAdmin.email);
        process.exit(0);
      }

      // Create a new admin user
      const user = new User(adminUser);
      await user.save();

      console.log(
        `Admin user created successfully with email: ${adminUser.email}`
      );
      console.log("You can now log in with these credentials.");
    } catch (error) {
      console.error("Error creating admin user:", error.message);
    }

    // Disconnect from database
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
    process.exit(1);
  });
