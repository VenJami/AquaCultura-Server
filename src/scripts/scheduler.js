/**
 * Scheduler for AquaCultura Background Jobs
 * 
 * This script sets up cron jobs to run various background tasks
 * like task reminders, notifications, and maintenance operations.
 */

const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to the database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for scheduler'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Helper function to run a script
function runScript(scriptPath) {
  const fullPath = path.join(__dirname, scriptPath);
  console.log(`Running script: ${fullPath}`);
  
  const child = spawn('node', [fullPath], {
    stdio: 'inherit'
  });
  
  child.on('close', (code) => {
    console.log(`Script ${scriptPath} exited with code ${code}`);
  });
  
  child.on('error', (err) => {
    console.error(`Error running script ${scriptPath}:`, err);
  });
}

// Schedule the task reminder job to run every day at 8:00 AM
cron.schedule('0 8 * * *', () => {
  console.log('Running task reminder job');
  runScript('./taskReminderJob.js');
});

// Schedule a weekly maintenance job every Sunday at midnight
cron.schedule('0 0 * * 0', () => {
  console.log('Running weekly maintenance job');
  // Add future maintenance scripts here
});

console.log('Scheduler started. Press Ctrl+C to exit.');

// Keep the process alive
process.stdin.resume(); 