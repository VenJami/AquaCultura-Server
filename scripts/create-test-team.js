const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Import the Team and User models
const Team = require("../src/models/Team");
const User = require("../src/models/User");

// Function to create a test team
const createTestTeam = async () => {
  try {
    // First, check if we have any users to assign as team lead
    const users = await User.find().limit(1);

    if (users.length === 0) {
      console.log("No users found. Creating a test user first.");

      // Create a test user if none exists
      const testUser = new User({
        name: "Test User",
        email: "test@example.com",
        password: "password123", // In a real app, hash this password
        role: "admin",
      });

      await testUser.save();
      console.log("Test user created:", testUser);

      // Create a test team with this user as lead
      const testTeam = new Team({
        name: "Test Team",
        description: "A test team created via script",
        leadId: testUser._id,
        leadName: testUser.name,
        members: [testUser._id],
      });

      await testTeam.save();
      console.log("Test team created with new user as lead:", testTeam);
    } else {
      // Use existing user as team lead
      const leadUser = users[0];

      const testTeam = new Team({
        name: "Test Team",
        description: "A test team created via script",
        leadId: leadUser._id,
        leadName: leadUser.name,
        members: [leadUser._id],
      });

      await testTeam.save();
      console.log("Test team created with existing user as lead:", testTeam);
    }

    // Verify the team was created
    const allTeams = await Team.find();
    console.log(`Total teams after creation: ${allTeams.length}`);
  } catch (err) {
    console.error("Error creating test team:", err);
  } finally {
    mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

// Execute the function
createTestTeam();
