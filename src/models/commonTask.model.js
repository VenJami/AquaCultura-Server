const mongoose = require("mongoose");

const commonTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A common task must have a title"],
      trim: true,
      maxlength: [
        100,
        "A common task title must have less than 100 characters",
      ],
    },
    description: {
      type: String,
      required: [true, "A common task must have a description"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    repeatPattern: {
      type: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
        required: [true, "A repeat pattern type is required"],
      },
      // For weekly pattern - which days of the week (0 = Sunday, 1 = Monday, etc.)
      days: [Number],
      // For monthly pattern - which day of the month (1-31)
      dayOfMonth: Number,
      // For yearly pattern - which month (0-11) and day
      month: Number,
    },
    startDate: {
      type: Date,
      default: Date.now,
      required: [true, "A common task must have a start date"],
    },
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    dueDate: Date,
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A common task must have a creator"],
    },
    // Team task related fields
    isTeamTask: {
      type: Boolean,
      default: false,
    },
    team: {
      type: String,
    },
    // Store assignee IDs and names as strings (serialized JSON)
    assigneeIds: {
      type: String,
    },
    assigneeNames: {
      type: String,
    },
    isWeekdayRecurring: {
      type: Boolean,
      default: false,
    },
    autoGenerateTasks: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for tasks generated from this common task
commonTaskSchema.virtual("generatedTasks", {
  ref: "Task",
  foreignField: "commonTaskId",
  localField: "_id",
});

// Pre-save middleware to validate repeatPattern based on type
commonTaskSchema.pre("save", function (next) {
  const pattern = this.repeatPattern;

  if (
    pattern.type === "weekly" &&
    (!pattern.days || pattern.days.length === 0)
  ) {
    return next(new Error("Weekly pattern must include days of the week"));
  }

  if (pattern.type === "monthly" && !pattern.dayOfMonth) {
    return next(new Error("Monthly pattern must include day of the month"));
  }

  if (pattern.type === "yearly" && (!pattern.month || !pattern.dayOfMonth)) {
    return next(
      new Error("Yearly pattern must include month and day of the month")
    );
  }

  // Add a flag for auto-generating tasks if this is a weekday (Mon-Fri) pattern
  if (
    pattern.type === "weekly" &&
    pattern.days.includes(1) &&
    pattern.days.includes(2) &&
    pattern.days.includes(3) &&
    pattern.days.includes(4) &&
    pattern.days.includes(5) &&
    pattern.days.length === 5
  ) {
    this.isWeekdayRecurring = true;
  } else {
    this.isWeekdayRecurring = false;
  }

  next();
});

// Query middleware to filter out inactive common tasks
commonTaskSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const CommonTask = mongoose.model("CommonTask", commonTaskSchema);

module.exports = CommonTask;
