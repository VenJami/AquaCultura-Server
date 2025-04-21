const Attendance = require("../models/attendance");
const User = require("../models/user");

/**
 * Get all attendance records
 * @route GET /api/attendance
 */
exports.getAllAttendance = async (req, res) => {
  try {
    const { userId, startDate, endDate, status } = req.query;

    // Build filter object
    const filter = {};

    if (userId) {
      filter.user = userId;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    if (status) {
      filter.status = status;
    }

    const attendance = await Attendance.find(filter)
      .populate("user", "name email")
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a single attendance record by ID
 * @route GET /api/attendance/:id
 */
exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get attendance records for a specific user
 * @route GET /api/attendance/user/:userId
 */
exports.getUserAttendance = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    // Build filter object
    const filter = { user: req.params.userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    if (status) {
      filter.status = status;
    }

    const attendance = await Attendance.find(filter)
      .populate("user", "name email")
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new attendance record
 * @route POST /api/attendance
 */
exports.createAttendance = async (req, res) => {
  try {
    const { user, date, timeIn, timeOut, status, notes } = req.body;

    // Validate user exists
    const userExists = await User.findById(user);
    if (!userExists) {
      return res.status(400).json({ message: "User not found" });
    }

    // Format date (remove time part) for uniqueness
    const formattedDate = date ? new Date(date) : new Date();
    formattedDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists for this user and date
    const existingAttendance = await Attendance.findOne({
      user,
      date: {
        $gte: formattedDate,
        $lt: new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance record already exists for this user and date",
      });
    }

    // Create new attendance record
    const attendance = new Attendance({
      user,
      date: formattedDate,
      timeIn: timeIn || new Date(),
      timeOut,
      status: status || "present",
      notes,
    });

    await attendance.save();

    res.status(201).json({
      message: "Attendance record created successfully",
      attendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an attendance record
 * @route PUT /api/attendance/:id
 */
exports.updateAttendance = async (req, res) => {
  try {
    const { timeIn, timeOut, status, notes } = req.body;

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Update fields
    if (timeIn) attendance.timeIn = timeIn;
    if (timeOut) attendance.timeOut = timeOut;
    if (status) attendance.status = status;
    if (notes !== undefined) attendance.notes = notes;

    await attendance.save();

    res.json({
      message: "Attendance record updated successfully",
      attendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete an attendance record
 * @route DELETE /api/attendance/:id
 */
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    await Attendance.findByIdAndDelete(req.params.id);

    res.json({ message: "Attendance record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
