const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");
const { protect } = require("../middleware/auth");

// All attendance routes require authentication but no role restrictions
router.use(protect);

// Get all attendance records (available for all authenticated users)
router.get("/", attendanceController.getAllAttendance);

// Get attendance for a specific user
router.get("/user/:userId", attendanceController.getUserAttendance);

// Create, get, update and delete specific attendance records
router.post("/", attendanceController.createAttendance);
router.get("/:id", attendanceController.getAttendanceById);
router.put("/:id", attendanceController.updateAttendance);
router.delete("/:id", attendanceController.deleteAttendance);

module.exports = router;
