/**
 * Script to create a user in the database
 * Run with: node src/scripts/create-user.js <name> <email> <password> <role>
 * Example: node src/scripts/create-user.js "John Doe" john@example.com password123 user
 */

const mongoose = require("mongoose");
const User = require("../models/user");
const connectDB = require("../config/database");
require("dotenv").config();

const createUser = async () => {
  try {
    // Get arguments
    const [, , name, email, password, role = "user"] = process.argv;

    if (!name || !email || !password) {
      console.error(
        "Usage: node src/scripts/create-user.js <name> <email> <password> <role>"
      );
      process.exit(1);
    }

    // Connect to the database
    await connectDB();
    console.log("Connected to MongoDB");

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error(`User with email ${email} already exists`);
      process.exit(1);
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: role === "admin" ? "admin" : "user",
    });

    await user.save();
    console.log("User created successfully:");
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);

    process.exit(0);
  } catch (error) {
    console.error("Error creating user:", error.message);
    process.exit(1);
  }
};

createUser();
