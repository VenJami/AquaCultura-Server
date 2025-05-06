// Import the User model
const User = require("../models/User");
const Team = require("../models/Team");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("team", "name");
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("team", "name description leadId");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @route   POST /api/users
// @desc    Create a user
// @access  Private/Admin
exports.createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user with plain password
    user = new User({
      name,
      email,
      password, // This password will be hashed in the next step
      role: role || "user",
    });

    // Hash password here (ensuring it happens)
    console.log("Manually hashing password in userController");
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    console.log("Password hashed successfully in userController");
    
    await user.save();

    // Create JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  const { name, email, password, role, active, team } = req.body;

  // Build user object
  const userFields = {};
  if (name) userFields.name = name;
  if (email) userFields.email = email;
  if (role) userFields.role = role;
  if (active !== undefined) userFields.active = active;
  
  // Handle team assignment if provided
  if (team !== undefined) {
    if (team) {
      // Check if team exists
      const teamExists = await Team.findById(team);
      if (!teamExists) {
        return res.status(404).json({ message: "Team not found" });
      }
      userFields.team = team;
      userFields.teamName = teamExists.name;
      
      // Add user to team if not already a member
      if (!teamExists.members.includes(req.params.id)) {
        teamExists.members.push(req.params.id);
        await teamExists.save();
      }
    } else {
      // If team is null/empty, remove user from their current team
      const user = await User.findById(req.params.id);
      if (user && user.team) {
        // Remove user from team members array
        await Team.updateOne(
          { _id: user.team },
          { $pull: { members: user._id } }
        );
      }
      
      userFields.team = null;
      userFields.teamName = "";
    }
  }

  try {
    // If password is being updated, hash it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      userFields.password = await bcrypt.hash(password, salt);
    }

    // Update user
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // If user belongs to a team, remove from team first
    if (user.team) {
      await Team.updateOne(
        { _id: user.team },
        { $pull: { members: user._id } }
      );
      
      // If user is team lead, additional action may be needed
      const team = await Team.findById(user.team);
      if (team && team.leadId.toString() === user._id.toString()) {
        // Either assign a new lead or handle as needed
        // Here we simply clear the lead fields as one option
        team.leadId = null;
        team.leadName = "";
        await team.save();
      }
    }
    
    await User.findByIdAndRemove(req.params.id);
    res.json({ message: "User removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).send("Server Error");
  }
}; 