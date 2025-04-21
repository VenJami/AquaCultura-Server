const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    timeIn: {
      type: Date,
      required: true,
      default: Date.now,
    },
    timeOut: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "halfDay"],
      default: "present",
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index on user and date to prevent duplicate entries
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
