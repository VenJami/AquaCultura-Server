const axios = require("axios");
require("dotenv").config();

const BASE_URL = `http://localhost:${process.env.PORT || 3000}/api`;
let authToken = "";
let createdTeamId = "";

// Function to log in and get token
const login = async () => {
  try {
    console.log("Attempting to log in...");
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: "test@example.com",
      password: "password123",
    });

    authToken = response.data.token;
    console.log("Login successful, token acquired");
    return true;
  } catch (err) {
    console.error("Login failed:", err.response?.data?.message || err.message);
    return false;
  }
};

// Function to get all teams
const getAllTeams = async () => {
  try {
    console.log("\nGetting all teams...");
    const response = await axios.get(`${BASE_URL}/teams`, {
      headers: { "x-auth-token": authToken },
    });

    console.log(`Retrieved ${response.data.length} teams:`);
    response.data.forEach((team) => {
      console.log(`- ${team.name} (ID: ${team._id})`);
    });

    // If there are teams, store the first one's ID for testing
    if (response.data.length > 0) {
      createdTeamId = response.data[0]._id;
    }

    return response.data;
  } catch (err) {
    console.error(
      "Error getting teams:",
      err.response?.data?.message || err.message
    );
    return [];
  }
};

// Function to create a team
const createTeam = async () => {
  try {
    console.log("\nCreating a new team...");
    const response = await axios.post(
      `${BASE_URL}/teams`,
      {
        name: "API Test Team",
        description: "A team created through the API",
        leadId: "67f12f4307aa60af488d9a1c", // Use the ID of an existing user
        leadName: "Test User",
      },
      {
        headers: { "x-auth-token": authToken },
      }
    );

    console.log("Team created successfully:");
    console.log(`- ${response.data.name} (ID: ${response.data._id})`);

    createdTeamId = response.data._id;
    return response.data;
  } catch (err) {
    console.error(
      "Error creating team:",
      err.response?.data?.message || err.message
    );
    return null;
  }
};

// Function to get a specific team
const getTeam = async (id) => {
  try {
    console.log(`\nGetting team with ID ${id}...`);
    const response = await axios.get(`${BASE_URL}/teams/${id}`, {
      headers: { "x-auth-token": authToken },
    });

    console.log("Team details:");
    console.log(`- Name: ${response.data.name}`);
    console.log(`- Description: ${response.data.description}`);
    console.log(`- Lead: ${response.data.leadName}`);
    console.log(`- Members: ${response.data.members.length}`);

    return response.data;
  } catch (err) {
    console.error(
      "Error getting team:",
      err.response?.data?.message || err.message
    );
    return null;
  }
};

// Main function to run all tests
const runTests = async () => {
  console.log("Starting API tests...");

  // Try to log in first
  const loggedIn = await login();
  if (!loggedIn) {
    console.log("Cannot proceed with tests without authentication");
    return;
  }

  // Get existing teams
  const teams = await getAllTeams();

  // Create a new team if none exist
  if (teams.length === 0) {
    await createTeam();
  }

  // If we have a team ID, get its details
  if (createdTeamId) {
    await getTeam(createdTeamId);
  }

  console.log("\nAPI tests completed");
};

// Run the tests
runTests().catch((err) => {
  console.error("Unhandled error during tests:", err);
});
