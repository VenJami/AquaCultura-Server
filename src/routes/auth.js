const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { protect, authorize } = require("../middleware/auth");

// Register user
router.post("/register", authController.register);

// Register admin user (protected, requires admin role)
router.post(
  "/register-admin",
  protect,
  authorize("admin"),
  authController.registerAdmin
);

// Login user
router.post("/login", authController.login);

// Get current user
router.get("/me", protect, authController.getMe);

module.exports = router;
