const Task = require("../models/task");
const User = require("../models/user");
const mongoose = require("mongoose");
const notificationHelper = require("../utils/notificationHelper");
const Team = require("../models/team");

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    // Fetch tasks with populated assignee
    const tasks = await Task.find()
      .sort({ createdAt: -1 })
      .populate("assignee", "name email");

    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get tasks by user (assigned to the user)
exports.getUserTasks = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    // Fetch tasks assigned to this user
    const tasks = await Task.find({ assignee: userId })
      .sort({ dueDate: 1 })
      .populate("assignee", "name email");

    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignee", "name email")
      .populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.status(200).json(task);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      priority,
      assigneeId,
      startDate,
      assigneeIds,
      team,
      isCustomTeam,
      customTeamMembers
    } = req.body;

    // Validate required fields
    if (!title || !dueDate) {
      return res.status(400).json({ message: "Title and due date are required" });
    }

    // Validate assignee information based on team or individual task
    const isTeamTask = req.body.isTeamTask === true;
    
    if (isTeamTask) {
      // For team tasks, team is required but individual assignee is optional
      if (!team) {
        return res.status(400).json({ message: "Team tasks require a team to be selected" });
      }
    } else {
      // For individual tasks, assigneeId is required
      if (!assigneeId) {
        return res.status(400).json({ message: "Individual tasks require an assignee" });
      }
    }

    // Determine primary assignee (the first assignee for team tasks)
    let primaryAssigneeId;
    
    // For team tasks
    if (isTeamTask) {
      if (assigneeIds && assigneeIds.length) {
        // Use the first team member as primary
        primaryAssigneeId = assigneeIds[0];
      } else if (assigneeId) {
        // Fall back to provided assigneeId
        primaryAssigneeId = assigneeId;
      } else if (req.user && req.user._id) {
        // If no assignees provided at all, use current user
        primaryAssigneeId = req.user._id;
      } else {
        // Last resort default ID (should never reach here in normal operation)
        primaryAssigneeId = "000000000000000000000000"; // Default MongoDB ObjectId
      }
    } else {
      // For individual tasks, use the specified assignee
      primaryAssigneeId = assigneeId;
    }

    // Create task data object
    const taskData = {
      title,
      description,
      dueDate: new Date(dueDate),
      startDate: startDate ? new Date(startDate) : new Date(),
      priority,
      assignee: primaryAssigneeId,
      createdBy: req.user?._id || primaryAssigneeId, // Fallback if user not available
      status: "Pending",
      isTeamTask
    };

    // Add team-specific fields if this is a team task
    if (isTeamTask) {
      // For team tasks, add the team name
      taskData.team = team;
      
      // Add assignee IDs if provided
      if (assigneeIds && assigneeIds.length) {
        taskData.assigneeIds = assigneeIds;
      } else {
        // If no specific assignees were selected, we still need an array
        // Use the primary assignee to create a single-item array
        taskData.assigneeIds = [primaryAssigneeId];
      }
      
      if (isCustomTeam) {
        taskData.isCustomTeam = true;
        // Ensure customTeamMembers contains valid ObjectIds, not string names
        if (customTeamMembers && customTeamMembers.length) {
          // Check if customTeamMembers are already ObjectIds or convertible to ObjectIds
          try {
            // If they're IDs, use them directly
            if (mongoose.Types.ObjectId.isValid(customTeamMembers[0])) {
              taskData.customTeamMembers = customTeamMembers;
            } else {
              // Don't store names in customTeamMembers, it's for ObjectIds only
              // Instead, use assigneeIds which are already ObjectIds
              taskData.customTeamMembers = taskData.assigneeIds;
            }
          } catch (err) {
            console.error("Invalid customTeamMembers format:", err);
            // Use assigneeIds as fallback
            taskData.customTeamMembers = taskData.assigneeIds;
          }
        }
      }
    }

    const task = new Task(taskData);
    await task.save();

    // Populate assignee and creator information
    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    // Send notification to admin
    await notificationHelper.adminTask(
      `New Task Created: ${title}`,
      `${req.user?.name || 'A user'} created a new ${
        isTeamTask ? 'team' : 'individual'
      } task with priority ${priority}`,
      "/tasks"
    );

    // Send notification to assignee (if not the creator)
    if (primaryAssigneeId && primaryAssigneeId.toString() !== (req.user?._id?.toString() || '')) {
      // Get assignee details
      const assignee = await User.findById(primaryAssigneeId);
      
      if (assignee) {
        await notificationHelper.notifyUser(
          primaryAssigneeId,
          `New Task Assigned: ${title}`,
          `You have been assigned a new task with priority ${priority}, due on ${new Date(dueDate).toLocaleDateString()}`,
          "task",
          `/tasks/${task._id}`
        );
      }
    }

    // If team task, notify all team members
    if (isTeamTask && taskData.assigneeIds && taskData.assigneeIds.length > 0) {
      for (const memberId of taskData.assigneeIds) {
        // Skip the primary assignee who was already notified
        if (memberId.toString() === primaryAssigneeId.toString()) continue;
        
        // Skip the creator
        if (req.user && memberId.toString() === req.user._id.toString()) continue;
        
        await notificationHelper.notifyUser(
          memberId,
          `Team Task Assigned: ${title}`,
          `You have been included in a team task with priority ${priority}`,
          "task",
          `/tasks/${task._id}`
        );
      }
    }

    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({
      message: "Failed to create task",
      error: error.message
    });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const updates = req.body;
    const taskId = req.params.id;

    // Find task
    let task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Store original status for comparison
    const originalStatus = task.status;
    const originalAssignee = task.assignee.toString();
    
    // Check if changing assignee
    if (updates.assigneeId && updates.assigneeId !== task.assignee.toString()) {
      const newAssignee = await User.findById(updates.assigneeId);
      if (!newAssignee) {
        return res.status(404).json({ error: "New assignee not found" });
      }

      task.assignee = updates.assigneeId;
      task.assigneeName = newAssignee.name;
      delete updates.assigneeId;
      
      // Notify the new assignee
      await notificationHelper.notifyUser(
        updates.assigneeId,
        `Task Reassigned: ${task.title}`,
        `A task has been reassigned to you: ${task.title}`,
        "task",
        `/tasks/${taskId}`
      );
      
      // Notify admins of reassignment
      await notificationHelper.adminTask(
        `Task Reassigned: ${task.title}`,
        `Task "${task.title}" has been reassigned to ${newAssignee.name}`,
        `/tasks/${taskId}`
      );
    }

    // Check if task is being completed
    if (updates.status === "Completed" && originalStatus !== "Completed") {
      task.completedAt = new Date();

      // Get the name of the user who completed the task
      const completedByName = req.user?.name || 'a user';
      
      // Notify the task assignee about successful completion
      if (task.assignee) {
        await notificationHelper.notifyUser(
          task.assignee,
          `Task Completed Successfully: ${task.title}`,
          `You have successfully completed the task: ${task.title}. Great job!`,
          "task",
          `/tasks/${taskId}`
        );
      }
      
      // If this task has a team associated with it, notify team members
      if (task.team) {
        // Get team members
        const team = await Team.findById(task.team);
        if (team && team.members && team.members.length > 0) {
          // Notify each team member except the assignee
          for (const memberId of team.members) {
            if (memberId.toString() !== task.assignee.toString()) {
              await notificationHelper.notifyUser(
                memberId,
                `Team Task Completed: ${task.title}`,
                `${completedByName} has completed the team task: ${task.title}`,
                "task",
                `/tasks/${taskId}`
              );
            }
          }
        }
      }
      
      // Notify admins when a task is completed
      await notificationHelper.adminTask(
        `Task Completed: ${task.title}`,
        `Task "${task.title}" has been marked as completed by ${completedByName}`,
        `/tasks/${taskId}`
      );
    } else if (updates.status && updates.status !== "Completed" && originalStatus === "Completed") {
      task.completedAt = null;
      
      // Notify admins when a completed task is reopened
      await notificationHelper.adminTask(
        `Task Reopened: ${task.title}`,
        `Task "${task.title}" has been reopened by ${req.user?.name || 'a user'}`,
        `/tasks/${taskId}`
      );
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      if (key !== "assigneeId") {
        task[key] = updates[key];
      }
    });

    await task.save();

    // Populate references for the response
    const updatedTask = await Task.findById(taskId)
      .populate("assignee", "name email")
      .populate("createdBy", "name email");

    return res.status(200).json(updatedTask);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findById(taskId).populate("assignee", "name");
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Notify admins of task deletion
    await notificationHelper.adminTask(
      `Task Deleted: ${task.title}`,
      `Task "${task.title}" that was assigned to ${task.assignee?.name || 'a user'} has been deleted by ${req.user?.name || 'a user'}`,
      "/tasks"
    );

    await Task.findByIdAndDelete(taskId);

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get task statistics
exports.getTaskStats = async (req, res) => {
  try {
    const stats = {
      total: await Task.countDocuments(),
      pending: await Task.countDocuments({ status: "Pending" }),
      inProgress: await Task.countDocuments({ status: "In Progress" }),
      completed: await Task.countDocuments({ status: "Completed" }),
      overdue: await Task.countDocuments({ status: "Overdue" }),
      highPriority: await Task.countDocuments({ priority: "High" }),
    };

    return res.status(200).json(stats);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
