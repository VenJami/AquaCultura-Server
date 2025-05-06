const jwt = require("jsonwebtoken");
const User = require("../models/user");
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const notificationHelper = require("../utils/notificationHelper");

/**
 * Register a new user
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password manually here
    console.log("Manually hashing password in controller");
    const hashedPassword = await bcryptjs.hash(password, 12);
    console.log("Password hashed successfully in controller");

    // Create new user with the hashed password
    const user = new User({
      name,
      email,
      password: hashedPassword, // Use the already hashed password
      role: role || "user", // Use provided role or default to "user"
    });

    // Save the user (the password is already hashed)
    await user.save();

    // Notify admins about new user registration
    await notificationHelper.adminUserNotification(
      "New User Registration",
      `${name} (${email}) has registered with the role of ${role || "user"}`,
      "/users"
    );

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        schedule: user.schedule,
        tasks: user.tasks,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Register a new admin user (protected route for admins only)
 * @route POST /api/auth/register-admin
 */
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password manually here
    console.log("Manually hashing admin password in controller");
    const hashedPassword = await bcryptjs.hash(password, 12);
    console.log("Admin password hashed successfully in controller");

    // Create new admin user with hashed password
    const user = new User({
      name,
      email,
      password: hashedPassword, // Use the already hashed password
      role: "admin", // Always set role to admin
    });

    await user.save();

    // Notify other admins about new admin creation
    await notificationHelper.adminUserNotification(
      "New Admin Account Created",
      `A new admin account has been created for ${name} (${email})`,
      "/users"
    );

    res.status(201).json({
      message: "Admin user created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Log in a user
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    console.log("Login attempt with email:", req.body.email);
    const { email, password } = req.body;

    // Directly use mongoose connection to avoid issues with model definition
    const userCollection = mongoose.connection.collection("users");
    console.log("Got user collection");

    // Find user document directly
    const userDoc = await userCollection.findOne({ email: email });

    if (!userDoc) {
      console.log("User not found");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("User found directly from collection:", userDoc.email);

    // Now get the user with the Mongoose model for proper methods
    const user = await mongoose
      .model("User")
      .findOne({ email })
      .select("+password");

    if (!user) {
      console.log("User found in collection but not via model");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Debug check for comparePassword method
    console.log("User found via model:", user.email);
    console.log("Password in DB:", !!user.password);
    console.log(
      "Model prototype methods:",
      Object.keys(mongoose.model("User").prototype)
    );
    console.log(
      "User object methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(user))
    );
    console.log(
      "comparePassword exists:",
      typeof user.comparePassword === "function"
    );

    // Manual password comparison if the method doesn't exist
    let isMatch = false;

    if (typeof user.comparePassword === "function") {
      // Use the method if it exists
      console.log("Using model's comparePassword method");
      isMatch = await user.comparePassword(password);
    } else if (
      typeof mongoose.model("User").compareUserPassword === "function"
    ) {
      // Try the static method if instance method is missing
      console.log("Using static compareUserPassword method");
      isMatch = await mongoose
        .model("User")
        .compareUserPassword(user._id, password);
    } else {
      // Fallback to manual comparison
      console.log("Using fallback password comparison");
      isMatch = await bcryptjs.compare(password, user.password);
    }

    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        schedule: user.schedule,
        tasks: user.tasks,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get the current user's profile
 * @route GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      schedule: user.schedule,
      tasks: user.tasks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
