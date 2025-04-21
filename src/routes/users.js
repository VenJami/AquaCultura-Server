const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect, authorize } = require("../middleware/auth");

// All user routes require authentication
router.use(protect);

// Routes restricted to admin role
router.get("/", authorize("admin"), userController.getAllUsers);
router.post("/", authorize("admin"), userController.createUser);
router.post("/admin", authorize("admin"), userController.createAdminUser);

// Routes that can be accessed by the user or admin
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.delete("/:id", authorize("admin"), userController.deleteUser);
router.put("/:id/password", userController.updatePassword);

module.exports = router;
