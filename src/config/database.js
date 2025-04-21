const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    console.log(
      `Connection string exists: ${process.env.MONGODB_URI ? "Yes" : "No"}`
    );

    // Add direct connection and auth options
    const uri = process.env.MONGODB_URI;

    // Connect with simplified options that are compatible with current MongoDB driver
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error(`Full error details: ${JSON.stringify(error, null, 2)}`);
    process.exit(1);
  }
};

module.exports = connectDB;
