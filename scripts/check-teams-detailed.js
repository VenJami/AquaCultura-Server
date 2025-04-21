const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
console.log("Attempting to connect to MongoDB...");
console.log(
  `Connection string: ${process.env.MONGODB_URI.substring(0, 20)}...`
);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");
    checkDatabase();
  })
  .catch((err) => {
    console.log("MongoDB Connection Error:", err);
    process.exit(1);
  });

// Function to check database details
const checkDatabase = async () => {
  try {
    // Check all collections in the database
    console.log("\nListing all collections:");
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    if (collections.length === 0) {
      console.log("No collections found in the database.");
    } else {
      collections.forEach((collection) => {
        console.log(`- ${collection.name}`);
      });
    }

    // Check for teams collection specifically
    console.log("\nLooking for teams collection:");
    const teamsCollectionExists = collections.some((c) => c.name === "teams");

    if (teamsCollectionExists) {
      console.log("Teams collection found!");

      // Count teams documents
      const teamsCount = await mongoose.connection.db
        .collection("teams")
        .countDocuments();
      console.log(`Number of team documents: ${teamsCount}`);

      // Get teams data
      if (teamsCount > 0) {
        const teams = await mongoose.connection.db
          .collection("teams")
          .find({})
          .toArray();
        console.log("\nTeams in database:");
        teams.forEach((team) => {
          console.log(`- ${team.name} (ID: ${team._id})`);
          console.log(`  Description: ${team.description}`);
          console.log(`  Created: ${team.createdAt}`);
          console.log(`  Members: ${team.members ? team.members.length : 0}`);
          console.log("---");
        });
      }
    } else {
      console.log("Teams collection not found in the database.");
    }

    // Close the connection
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed");
  } catch (err) {
    console.error("Error checking database:", err);
    mongoose.connection.close();
  }
};
