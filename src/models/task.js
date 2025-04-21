const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    completedDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Overdue"],
      default: "Pending",
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assigneeName: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isTeamTask: {
      type: Boolean,
      default: false,
    },
    // New fields for team tasks - updated to handle JSON encoded strings
    assigneeIds: {
      type: String, // Changed from array to String to handle JSON encoded arrays
    },
    team: {
      type: String,
      trim: true,
    },
    isCustomTeam: {
      type: Boolean,
      default: false,
    },
    customTeamMembers: {
      type: String, // Changed from array to String to handle JSON encoded arrays
    },
    commonTaskId: {
      type: Schema.Types.ObjectId,
      ref: "CommonTask",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to check if status should be Overdue
taskSchema.pre("save", function (next) {
  // Only run if status is not Completed and due date exists
  if (this.status !== "Completed" && this.dueDate) {
    const now = new Date();
    // If due date is in the past, mark as Overdue
    if (this.dueDate < now) {
      this.status = "Overdue";
    }
  }
  next();
});

// Query middleware to filter out inactive tasks
taskSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
  next();
});

// Virtual to check if a task is upcoming (start date is in the future)
taskSchema.virtual("isUpcoming").get(function () {
  return this.startDate > new Date();
});

// Create Task model
const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
