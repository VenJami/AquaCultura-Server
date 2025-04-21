/**
 * Script to create a demo user in the database
 * Run with: node src/scripts/create-demo-user.js
 */

const mongoose = require("mongoose");
const User = require("../models/user");
const connectDB = require("../config/database");
require("dotenv").config();

const createDemoUser = async () => {
  try {
    // Connect to the database
    await connectDB();
    console.log("Connected to MongoDB");

    // Demo user credentials
    const name = "Demo User";
    const email = "demo@aquacultura.com";
    const password = "password123";
    const role = "user";

    // Check if demo user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Demo user already exists:");
      console.log(`Name: ${existingUser.name}`);
      console.log(`Email: ${existingUser.email}`);
      console.log(`Role: ${existingUser.role}`);
      process.exit(0);
    }

    // Create demo user
    const user = new User({
      name,
      email,
      password,
      role,
    });

    await user.save();
    console.log("Demo user created successfully:");
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${user.role}`);

    process.exit(0);
  } catch (error) {
    console.error("Error creating demo user:", error.message);
    process.exit(1);
  }
};

createDemoUser();
