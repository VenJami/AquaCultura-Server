/**
 * Task Reminder Job
 * 
 * This script checks for tasks that are due soon and sends reminders
 * to the assigned users. It's designed to be run as a scheduled job.
 */

const mongoose = require('mongoose');
const Task = require('../models/task');
const notificationHelper = require('../utils/notificationHelper');
require('dotenv').config();

// Connect to the database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for task reminder job'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

/**
 * Send reminders for tasks due within the specified number of days
 * @param {number} daysThreshold - Tasks due within this many days will trigger reminders
 */
async function sendTaskReminders(daysThreshold = 2) {
  try {
    console.log(`Checking for tasks due in the next ${daysThreshold} days...`);
    
    // Calculate the date range
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);
    
    // Find tasks that are:
    // 1. Not completed
    // 2. Due between now and the threshold date
    const tasks = await Task.find({
      status: { $ne: 'Completed' },
      dueDate: { 
        $gte: today,
        $lte: thresholdDate
      }
    }).populate('assignee', 'name email');
    
    console.log(`Found ${tasks.length} tasks due soon`);
    
    // Send notifications for each task
    for (const task of tasks) {
      if (!task.assignee) {
        console.log(`Task ${task._id} (${task.title}) has no assignee. Skipping.`);
        continue;
      }
      
      // Send reminder notification
      await notificationHelper.taskDueReminder(
        task.assignee._id,
        task.title,
        task.dueDate,
        task._id
      );
      
      console.log(`Sent reminder for task "${task.title}" to ${task.assignee.name}`);
    }
    
    console.log('Task reminder job completed successfully');
    
    // Close database connection
    setTimeout(() => {
      mongoose.connection.close();
      console.log('Database connection closed');
    }, 1000);
    
  } catch (error) {
    console.error('Error in task reminder job:', error);
    mongoose.connection.close();
  }
}

// Run the reminder job for tasks due in the next 2 days
sendTaskReminders(2); 