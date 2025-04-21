const CommonTask = require("../models/commonTask.model");
const Task = require("../models/task");
const { successResponse, errorResponse } = require("../utils/response.util");

/**
 * Get all common tasks
 */
exports.getAllCommonTasks = async (req, res) => {
  try {
    const commonTasks = await CommonTask.find({})
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    return successResponse(
      res,
      "Common tasks fetched successfully",
      commonTasks
    );
  } catch (error) {
    return errorResponse(res, "Failed to fetch common tasks", 500, error);
  }
};

/**
 * Get a common task by ID
 */
exports.getCommonTaskById = async (req, res) => {
  try {
    const commonTask = await CommonTask.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!commonTask) {
      return errorResponse(res, "Common task not found", 404);
    }

    return successResponse(res, "Common task fetched successfully", commonTask);
  } catch (error) {
    return errorResponse(res, "Failed to fetch common task", 500, error);
  }
};

/**
 * Create a new common task
 */
exports.createCommonTask = async (req, res) => {
  try {
    let {
      title,
      description,
      priority,
      repeatPattern,
      assignedTo,
      dueDate,
      startDate,
      autoGenerateTasks = false,
      assigneeIds,
      assigneeNames,
      isTeamTask,
      team,
    } = req.body;

    if (!title || !description || !repeatPattern) {
      return errorResponse(
        res,
        "Title, description, and repeat pattern are required",
        400
      );
    }

    // Parse repeatPattern if it's a string (JSON format)
    if (typeof repeatPattern === "string") {
      try {
        repeatPattern = JSON.parse(repeatPattern);
        console.log("Parsed repeatPattern from JSON string:", repeatPattern);
      } catch (parseError) {
        return errorResponse(
          res,
          "Invalid repeat pattern format",
          400,
          parseError
        );
      }
    }

    // Log but don't parse assigneeIds and assigneeNames - keep them as strings
    if (typeof assigneeIds === "string") {
      console.log("Received assigneeIds as string:", assigneeIds);
      try {
        // Try to parse to see if it's a JSON string
        JSON.parse(assigneeIds);
        console.log("assigneeIds is valid JSON");
      } catch (e) {
        console.log("assigneeIds is not valid JSON, will be wrapped");
      }
    } else if (Array.isArray(assigneeIds)) {
      console.log("Received assigneeIds as array:", assigneeIds);
      // Convert to JSON string
      assigneeIds = JSON.stringify(assigneeIds);
      console.log("Converted assigneeIds to string:", assigneeIds);
    }

    if (typeof assigneeNames === "string") {
      console.log("Received assigneeNames as string:", assigneeNames);
      try {
        // Try to parse to see if it's a JSON string
        JSON.parse(assigneeNames);
        console.log("assigneeNames is valid JSON");
      } catch (e) {
        console.log("assigneeNames is not valid JSON, will be wrapped");
      }
    } else if (Array.isArray(assigneeNames)) {
      console.log("Received assigneeNames as array:", assigneeNames);
      // Convert to JSON string
      assigneeNames = JSON.stringify(assigneeNames);
      console.log("Converted assigneeNames to string:", assigneeNames);
    }

    // Validate and transform repeat pattern based on type
    const { type } = repeatPattern;
    if (!type) {
      return errorResponse(res, "Repeat pattern type is required", 400);
    }

    // Convert days to integers if they are strings
    if (type === "weekly" && repeatPattern.days) {
      // If repeatPattern.days is a string, try to parse it
      if (typeof repeatPattern.days === "string") {
        try {
          repeatPattern.days = JSON.parse(repeatPattern.days);
          console.log("Parsed days from JSON string:", repeatPattern.days);
        } catch (e) {
          console.error("Error parsing days JSON string:", e);
          return errorResponse(
            res,
            "Invalid days format for weekly repeat pattern",
            400
          );
        }
      }

      // Ensure days are integers
      repeatPattern.days = repeatPattern.days.map((day) =>
        typeof day === "string" ? parseInt(day, 10) : day
      );

      // Remove duplicate days (if any)
      repeatPattern.days = [...new Set(repeatPattern.days)];

      console.log("Days after removing duplicates:", repeatPattern.days);

      // Validate days after conversion
      if (!repeatPattern.days || repeatPattern.days.length === 0) {
        return errorResponse(
          res,
          "Days are required for weekly repeat pattern",
          400
        );
      }
    }

    // Convert dayOfMonth to integer if it's a string
    if ((type === "monthly" || type === "yearly") && repeatPattern.dayOfMonth) {
      repeatPattern.dayOfMonth =
        typeof repeatPattern.dayOfMonth === "string"
          ? parseInt(repeatPattern.dayOfMonth, 10)
          : repeatPattern.dayOfMonth;

      if (!repeatPattern.dayOfMonth) {
        return errorResponse(
          res,
          "Day of month is required for " + type + " repeat pattern",
          400
        );
      }
    }

    // Convert month to integer if it's a string
    if (type === "yearly" && repeatPattern.month !== undefined) {
      repeatPattern.month =
        typeof repeatPattern.month === "string"
          ? parseInt(repeatPattern.month, 10)
          : repeatPattern.month;

      if (repeatPattern.month === undefined) {
        return errorResponse(
          res,
          "Month is required for yearly repeat pattern",
          400
        );
      }
    }

    // Continue with the rest of the function...
    const commonTaskData = {
      title,
      description,
      priority: priority || "medium",
      repeatPattern,
      startDate: startDate || new Date(),
      assignedTo,
      dueDate,
      createdBy: req.user._id,
      active: true,
      autoGenerateTasks: autoGenerateTasks || false,
    };

    // Add team-related fields if applicable
    if (isTeamTask) {
      commonTaskData.isTeamTask = true;
      commonTaskData.team = team;

      // Store assigneeIds and assigneeNames - ensure they're strings
      if (assigneeIds) {
        // Ensure it's a string
        commonTaskData.assigneeIds =
          typeof assigneeIds === "string"
            ? assigneeIds
            : JSON.stringify(assigneeIds);
      }

      if (assigneeNames) {
        // Ensure it's a string
        commonTaskData.assigneeNames =
          typeof assigneeNames === "string"
            ? assigneeNames
            : JSON.stringify(assigneeNames);
      }
    }

    const commonTask = new CommonTask(commonTaskData);

    const savedCommonTask = await commonTask.save();
    await savedCommonTask.populate("assignedTo", "name email");
    await savedCommonTask.populate("createdBy", "name email");

    // Automatically generate tasks if requested or if it's a weekday recurring pattern (Mon-Fri)
    if (autoGenerateTasks || savedCommonTask.isWeekdayRecurring) {
      /* Note: Instead of generating tasks immediately, we'll let the scheduled daily job
         handle task generation to avoid flooding the task list with future tasks.
         This allows users to see tasks only for the near future, and new tasks will
         be created automatically as time progresses. */

      // Return a success message without generating tasks immediately
      return successResponse(
        res,
        "Common task created successfully. Tasks will be automatically generated according to the schedule.",
        {
          commonTask: savedCommonTask,
          message:
            "Auto-generation is enabled. Tasks will be created by the daily scheduler.",
          tasksCount: 0,
        }
      );
    }

    return successResponse(
      res,
      "Common task created successfully",
      savedCommonTask
    );
  } catch (error) {
    return errorResponse(res, "Failed to create common task", 500, error);
  }
};

/**
 * Update a common task
 */
exports.updateCommonTask = async (req, res) => {
  try {
    let {
      title,
      description,
      priority,
      repeatPattern,
      assignedTo,
      dueDate,
      startDate,
      active,
      autoGenerateTasks,
    } = req.body;

    const commonTask = await CommonTask.findById(req.params.id);

    if (!commonTask) {
      return errorResponse(res, "Common task not found", 404);
    }

    // Parse repeatPattern if it's a string (JSON format)
    if (repeatPattern && typeof repeatPattern === "string") {
      try {
        repeatPattern = JSON.parse(repeatPattern);
        console.log("Parsed repeatPattern from JSON string:", repeatPattern);
      } catch (parseError) {
        return errorResponse(
          res,
          "Invalid repeat pattern format",
          400,
          parseError
        );
      }
    }

    // Validate repeat pattern if it's being updated
    if (repeatPattern) {
      const { type } = repeatPattern;
      if (!type) {
        return errorResponse(res, "Repeat pattern type is required", 400);
      }

      if (
        type === "weekly" &&
        (!repeatPattern.days || repeatPattern.days.length === 0)
      ) {
        return errorResponse(
          res,
          "Days are required for weekly repeat pattern",
          400
        );
      }

      if (type === "monthly" && !repeatPattern.dayOfMonth) {
        return errorResponse(
          res,
          "Day of month is required for monthly repeat pattern",
          400
        );
      }

      if (
        type === "yearly" &&
        (!repeatPattern.dayOfMonth || repeatPattern.month === undefined)
      ) {
        return errorResponse(
          res,
          "Day of month and month are required for yearly repeat pattern",
          400
        );
      }
    }

    // Update fields
    if (title !== undefined) commonTask.title = title;
    if (description !== undefined) commonTask.description = description;
    if (priority !== undefined) commonTask.priority = priority;
    if (repeatPattern !== undefined) commonTask.repeatPattern = repeatPattern;
    if (startDate !== undefined) commonTask.startDate = startDate;
    if (assignedTo !== undefined) commonTask.assignedTo = assignedTo;
    if (dueDate !== undefined) commonTask.dueDate = dueDate;
    if (active !== undefined) commonTask.active = active;
    if (autoGenerateTasks !== undefined)
      commonTask.autoGenerateTasks = autoGenerateTasks;

    const updatedCommonTask = await commonTask.save();
    await updatedCommonTask.populate("assignedTo", "name email");
    await updatedCommonTask.populate("createdBy", "name email");

    /* Note: We're no longer generating tasks immediately when autoGenerateTasks is enabled.
       Instead, tasks will be generated by a scheduled job/cron task that runs daily.
       This prevents flooding the task list with future tasks and makes it easier to
       stop auto-generation at any time. */

    return successResponse(
      res,
      "Common task updated successfully. Tasks will be generated automatically on their scheduled dates.",
      updatedCommonTask
    );
  } catch (error) {
    return errorResponse(res, "Failed to update common task", 500, error);
  }
};

/**
 * Delete a common task
 */
exports.deleteCommonTask = async (req, res) => {
  try {
    const commonTask = await CommonTask.findByIdAndDelete(req.params.id);

    if (!commonTask) {
      return errorResponse(res, "Common task not found", 404);
    }

    return successResponse(res, "Common task deleted successfully", {
      id: req.params.id,
    });
  } catch (error) {
    return errorResponse(res, "Failed to delete common task", 500, error);
  }
};

/**
 * Generate tasks from common task
 */
exports.generateTasksFromCommonTask = async (req, res) => {
  try {
    const { commonTaskId, startDate, endDate } = req.body;

    if (!commonTaskId || !endDate) {
      return errorResponse(
        res,
        "Common task ID and end date are required",
        400
      );
    }

    const commonTask = await CommonTask.findById(commonTaskId);

    if (!commonTask) {
      return errorResponse(res, "Common task not found", 404);
    }

    // Use provided startDate or the one from the commonTask
    const taskStartDate = startDate
      ? new Date(startDate)
      : new Date(commonTask.startDate);

    // Generate dates based on repeat pattern
    const dates = generateDatesFromPattern(
      commonTask.repeatPattern,
      taskStartDate,
      new Date(endDate)
    );

    // Create tasks for each generated date
    const tasks = [];

    for (const date of dates) {
      const task = new Task({
        title: commonTask.title,
        description: commonTask.description,
        priority: commonTask.priority,
        status: "pending",
        dueDate: date,
        assignedTo: commonTask.assignedTo,
        createdBy: req.user._id,
        isGeneratedFromCommonTask: true,
        commonTaskId: commonTask._id,
      });

      const savedTask = await task.save();
      tasks.push(savedTask);
    }

    return successResponse(
      res,
      `Successfully generated ${tasks.length} tasks`,
      {
        tasks,
        count: tasks.length,
      }
    );
  } catch (error) {
    return errorResponse(res, "Failed to generate tasks", 500, error);
  }
};

/**
 * Create a single task from a common task
 */
exports.createTaskFromCommonTask = async (req, res) => {
  try {
    const { dueDate } = req.body;
    const commonTaskId = req.params.id;

    if (!dueDate) {
      return errorResponse(res, "Due date is required", 400);
    }

    const commonTask = await CommonTask.findById(commonTaskId);

    if (!commonTask) {
      return errorResponse(res, "Common task not found", 404);
    }

    // Check if dueDate is after startDate
    const taskDueDate = new Date(dueDate);
    const taskStartDate = new Date(commonTask.startDate);

    if (taskDueDate < taskStartDate) {
      return errorResponse(
        res,
        "Due date cannot be before the start date",
        400
      );
    }

    const task = new Task({
      title: commonTask.title,
      description: commonTask.description,
      priority: commonTask.priority,
      status: "pending",
      dueDate: taskDueDate,
      assignedTo: commonTask.assignedTo,
      createdBy: req.user._id,
      isGeneratedFromCommonTask: true,
      commonTaskId: commonTask._id,
    });

    const savedTask = await task.save();

    return successResponse(
      res,
      "Task created successfully from common task",
      savedTask
    );
  } catch (error) {
    return errorResponse(
      res,
      "Failed to create task from common task",
      500,
      error
    );
  }
};

/**
 * Generate tasks from a specific common task for a date range
 * Note: This function should be used with caution as it can create many tasks at once.
 * For regular task creation, the automatic daily generator is preferred.
 */
exports.generateTasksFromSpecificCommonTask = async (req, res) => {
  try {
    const commonTaskId = req.params.id;
    let { startDate, endDate, assignToCurrentUser = false } = req.body;

    if (!commonTaskId) {
      return errorResponse(res, "Common task ID is required", 400);
    }

    // If start date is not provided, default to today
    if (!startDate) {
      startDate = new Date();
    } else {
      startDate = new Date(startDate);
    }

    // If end date is not provided, default to 2 weeks from start date
    // Limited to 2 weeks to avoid flooding the task list
    if (!endDate) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14); // 2 weeks ahead
    } else {
      endDate = new Date(endDate);

      // Maximum 30 days date range to prevent flooding
      const maxEndDate = new Date(startDate);
      maxEndDate.setDate(maxEndDate.getDate() + 30);

      if (endDate > maxEndDate) {
        console.warn(
          `End date adjusted from ${endDate} to ${maxEndDate} to prevent task list flooding`
        );
        endDate = maxEndDate;
      }
    }

    const commonTask = await CommonTask.findById(commonTaskId);

    if (!commonTask) {
      return errorResponse(res, "Common task not found", 404);
    }

    // Generate dates based on repeat pattern
    const dates = generateDatesFromPattern(
      commonTask.repeatPattern,
      startDate,
      endDate
    );

    // Create tasks for each generated date
    const tasks = [];

    for (const date of dates) {
      // Calculate due date
      const taskDueDate = commonTask.dueDate
        ? new Date(commonTask.dueDate)
        : new Date(date);

      if (!commonTask.dueDate) {
        // If no specific due date, set it to end of the day
        taskDueDate.setHours(23, 59, 59);
      }

      // Determine assignee - either from the common task, or current user if specified
      const assignee = assignToCurrentUser
        ? req.user._id
        : commonTask.assignedTo;

      const taskData = {
        title: commonTask.title,
        description: commonTask.description,
        priority:
          commonTask.priority.charAt(0).toUpperCase() +
          commonTask.priority.slice(1), // Capitalize first letter
        status: "Pending",
        startDate: date,
        dueDate: taskDueDate,
        assignee: assignee,
        createdBy: req.user._id,
        commonTaskId: commonTask._id,
      };

      // Handle team task properties if this is a team task
      if (commonTask.isTeamTask) {
        taskData.isTeamTask = true;
        taskData.team = commonTask.team;

        // Copy the assigneeIds string (which should be a JSON string)
        if (commonTask.assigneeIds) {
          // Make sure this is a string since the model expects it to be one
          taskData.assigneeIds = commonTask.assigneeIds;
        }
      }

      const task = new Task(taskData);
      const savedTask = await task.save();
      tasks.push(savedTask);
    }

    return successResponse(
      res,
      `Successfully generated ${tasks.length} tasks from common task`,
      {
        tasks,
        count: tasks.length,
      }
    );
  } catch (error) {
    return errorResponse(res, "Failed to generate tasks", 500, error);
  }
};

/**
 * Helper function to generate dates based on repeat pattern
 */
function generateDatesFromPattern(pattern, startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);

  // Ensure we're dealing with the start of the day for consistency
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    // Check if the current date matches the pattern
    if (matchesPattern(currentDate, pattern)) {
      dates.push(new Date(currentDate));
    }

    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * Check if a date matches the repeat pattern
 */
function matchesPattern(date, pattern) {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfMonth = date.getDate();
  const month = date.getMonth(); // 0 = January, 11 = December

  switch (pattern.type) {
    case "daily":
      return true;

    case "weekly":
      // First convert pattern.days to an array if it's a string
      let days = pattern.days;
      if (typeof days === "string") {
        try {
          days = JSON.parse(days);
        } catch (e) {
          console.error("Error parsing days:", e);
          return false;
        }
      }

      // Make sure we're working with a Set for O(1) lookups
      // and to eliminate any duplicates
      const daysSet = new Set(days);

      // Check if the current day is in the pattern
      return daysSet.has(day);

    case "monthly":
      // pattern.dayOfMonth is a number (1-31)
      return dayOfMonth === pattern.dayOfMonth;

    case "yearly":
      // pattern.month is a number (0-11) and dayOfMonth is a number (1-31)
      return month === pattern.month && dayOfMonth === pattern.dayOfMonth;

    default:
      return false;
  }
}

/**
 * Daily task generator for scheduled execution
 * This should be called by a cron job or scheduler once per day at 7:00 AM
 * It only generates tasks for the current day, not future dates,
 * to avoid flooding the task list with too many tasks at once.
 */
exports.generateDailyTasks = async (req, res) => {
  try {
    // Find all common tasks with auto-generation enabled
    const commonTasks = await CommonTask.find({
      autoGenerateTasks: true,
      active: true,
    });

    console.log(
      `Found ${commonTasks.length} common tasks with auto-generation enabled`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, etc.
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    console.log(`Today is ${dayNames[dayOfWeek]} (day ${dayOfWeek})`);

    let totalTasksGenerated = 0;
    const generatedTasksByCommonTask = {};

    // Process each common task
    for (const commonTask of commonTasks) {
      try {
        // Reduced logging - just a brief mention of which task is being checked
        console.log(
          `Checking common task: ${commonTask.title} (${commonTask._id})`
        );

        // Check if today matches the pattern for this common task
        if (matchesPattern(today, commonTask.repeatPattern)) {
          console.log(
            `Pattern match for today's date with common task: ${commonTask.title}`
          );

          // Capitalize the first letter of priority to match Task model
          const capitalizedPriority =
            commonTask.priority.charAt(0).toUpperCase() +
            commonTask.priority.slice(1);

          // Determine assignee - required field in Task model
          let assigneeId = null;

          if (commonTask.isTeamTask && commonTask.assigneeIds) {
            try {
              // Parse the JSON string of assignee IDs
              const parsedIds = JSON.parse(commonTask.assigneeIds);
              if (parsedIds && parsedIds.length > 0) {
                assigneeId = parsedIds[0]; // Use first team member as assignee
              }
            } catch (e) {
              console.error(
                `Error parsing assigneeIds for task ${commonTask._id}:`,
                e
              );
            }
          }

          // If no assignee found through team, use the one on the common task
          if (!assigneeId && commonTask.assignedTo) {
            assigneeId = commonTask.assignedTo;
          }

          // If still no assignee, use the API caller or a fallback ID
          if (!assigneeId) {
            assigneeId = req ? req.user?._id : "000000000000000000000000"; // Fallback ID
          }

          // Calculate due date based on start time or end of day
          const taskDueDate = commonTask.dueDate
            ? new Date(commonTask.dueDate)
            : new Date(today);

          // If no specific due date set, use end of day
          if (!commonTask.dueDate) {
            taskDueDate.setHours(23, 59, 59);
          }

          const taskData = {
            title: commonTask.title,
            description: commonTask.description,
            priority: capitalizedPriority,
            status: "Pending",
            startDate: today,
            dueDate: taskDueDate,
            assignee: assigneeId,
            createdBy: commonTask.createdBy,
            commonTaskId: commonTask._id,
          };

          // Add team-related fields if applicable
          if (commonTask.isTeamTask) {
            taskData.isTeamTask = true;
            taskData.team = commonTask.team;

            // Keep the assigneeIds as a JSON string
            if (commonTask.assigneeIds) {
              taskData.assigneeIds = commonTask.assigneeIds;
            }
          }

          // Create the task for today
          const task = new Task(taskData);
          const savedTask = await task.save();
          console.log(`Task created: ${savedTask._id} for ${commonTask.title}`);

          // Keep track of generated tasks
          if (!generatedTasksByCommonTask[commonTask._id]) {
            generatedTasksByCommonTask[commonTask._id] = [];
          }
          generatedTasksByCommonTask[commonTask._id].push(savedTask);
          totalTasksGenerated++;
        } else {
          console.log(`No pattern match for common task: ${commonTask.title}`);
        }
      } catch (error) {
        console.error(`Error processing common task ${commonTask._id}:`, error);
        // Continue with other common tasks even if one fails
      }
    }

    if (res) {
      // If this was called via API
      return successResponse(
        res,
        `Daily task generation complete. Generated ${totalTasksGenerated} tasks.`,
        {
          tasksCount: totalTasksGenerated,
          tasksByCommonTask: generatedTasksByCommonTask,
        }
      );
    } else {
      // If this was called programmatically (e.g., by a scheduler)
      console.log(
        `Daily task generation complete. Generated ${totalTasksGenerated} tasks.`
      );
      return {
        success: true,
        tasksCount: totalTasksGenerated,
        tasksByCommonTask: generatedTasksByCommonTask,
      };
    }
  } catch (error) {
    console.error("Error in daily task generation:", error);
    if (res) {
      return errorResponse(res, "Failed to generate daily tasks", 500, error);
    } else {
      return { success: false, error: error.message };
    }
  }
};
