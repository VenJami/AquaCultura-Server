/**
 * Script to create an admin user in the database
 * Run with: node src/scripts/create-admin-user.js
 */

const mongoose = require("mongoose");
const User = require("../models/user");
const connectDB = require("../config/database");
require("dotenv").config();

const createAdminUser = async () => {
  try {
    // Connect to the database
    await connectDB();
    console.log("Connected to MongoDB");

    // Admin user credentials
    const name = "Admin User";
    const email = "admin@aquacultura.com";
    const password = "admin123";
    const role = "admin";

    // Check if admin user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Admin user already exists:");
      console.log(`Name: ${existingUser.name}`);
      console.log(`Email: ${existingUser.email}`);
      console.log(`Role: ${existingUser.role}`);
      process.exit(0);
    }

    // Create admin user
    const user = new User({
      name,
      email,
      password,
      role,
    });

    await user.save();
    console.log("Admin user created successfully:");
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${user.role}`);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error.message);
    process.exit(1);
  }
};

createAdminUser();
