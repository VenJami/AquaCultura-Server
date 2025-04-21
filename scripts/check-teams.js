const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Import the Team model
const Team = require("../src/models/Team");

// Function to get all teams
const getTeams = async () => {
  try {
    const teams = await Team.find();
    console.log("Total teams found:", teams.length);
    console.log("Teams:", JSON.stringify(teams, null, 2));
  } catch (err) {
    console.error("Error getting teams:", err.message);
  } finally {
    // Close the connection - updated for newer Mongoose versions
    mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  }
};

// Execute the function
getTeams();
