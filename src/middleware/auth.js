const jwt = require("jsonwebtoken");
const User = require("../models/user");

const protect = async (req, res, next) => {
  try {
    // Get token from header
    const token =
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.header("x-auth-token");

    if (!token) {
      return res.status(401).json({ message: "Please authenticate" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Please authenticate" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Please authenticate" });
  }
};

// Authorize by role - superadmin always has access to everything
const authorize = (...roles) => {
  return (req, res, next) => {
    // Superadmin override - superadmins have access to everything
    if (req.user.role === "superadmin") {
      return next();
    }

    // Add admin role automatically if roles include 'admin'
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
