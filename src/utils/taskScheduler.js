const CommonTask = require('../models/commonTask.model');
const Task = require('../models/task');
const { generateDatesFromPattern } = require('./dateUtils');

/**
 * Generates tasks for the next week from all active common tasks
 * Should be run on a schedule (e.g., daily at midnight)
 */
async function generateUpcomingTasks() {
  try {
    console.log('Starting automatic task generation for recurring tasks...');
    
    // Get all active common tasks
    const commonTasks = await CommonTask.find({ 
      active: true,
      // Focus especially on weekday recurring tasks
      isWeekdayRecurring: true
    });
    
    console.log(`Found ${commonTasks.length} active common tasks to check`);
    
    const now = new Date();
    const oneWeekFromNow = new Date(now);
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    let totalTasksGenerated = 0;
    
    // For each common task, generate tasks for the next week
    for (const commonTask of commonTasks) {
      try {
        // Get most recent generated task for this common task
        const latestTask = await Task.findOne({ 
          commonTaskId: commonTask._id 
        }).sort({ 
          startDate: -1 
        });
        
        // Determine start date for generation
        // If there's a latest task, start from the day after its start date
        // Otherwise, use the common task's start date or today
        let startDate;
        if (latestTask && latestTask.startDate) {
          startDate = new Date(latestTask.startDate);
          startDate.setDate(startDate.getDate() + 1);
          
          // If the next day is still in the past, use today
          if (startDate < now) {
            startDate = now;
          }
        } else {
          startDate = commonTask.startDate > now ? commonTask.startDate : now;
        }
        
        // Generate dates for the next week
        const dates = generateDatesFromPattern(
          commonTask.repeatPattern,
          startDate,
          oneWeekFromNow
        );
        
        console.log(`Generated ${dates.length} dates for task "${commonTask.title}"`);
        
        // Create new tasks for each date
        for (const date of dates) {
          const taskDueDate = commonTask.dueDate 
            ? new Date(commonTask.dueDate) 
            : new Date(date);
          
          if (!commonTask.dueDate) {
            // If no specific due date, set it to end of the day
            taskDueDate.setHours(23, 59, 59);
          }
          
          // Check if a task already exists for this date and common task
          const existingTask = await Task.findOne({
            commonTaskId: commonTask._id,
            startDate: { 
              $gte: new Date(date.setHours(0, 0, 0)),
              $lte: new Date(date.setHours(23, 59, 59)) 
            }
          });
          
          if (existingTask) {
            console.log(`Task already exists for ${date.toISOString().split('T')[0]}, skipping`);
            continue;
          }
          
          // Create the task
          const task = new Task({
            title: commonTask.title,
            description: commonTask.description,
            priority: commonTask.priority.charAt(0).toUpperCase() + commonTask.priority.slice(1),
            status: 'Pending',
            startDate: date,
            dueDate: taskDueDate,
            assignee: commonTask.assignedTo,
            assigneeName: '', // Will be populated by pre-save hook if needed
            createdBy: commonTask.createdBy,
            commonTaskId: commonTask._id
          });
          
          await task.save();
          totalTasksGenerated++;
        }
      } catch (taskError) {
        console.error(`Error generating tasks for common task ${commonTask._id}:`, taskError);
      }
    }
    
    console.log(`Task generation complete. Generated ${totalTasksGenerated} new tasks.`);
    return {
      success: true,
      tasksGenerated: totalTasksGenerated
    };
  } catch (error) {
    console.error('Error in task generation scheduler:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateUpcomingTasks
}; 