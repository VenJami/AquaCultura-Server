/**
 * Standardized error handler for API responses
 * @param {Object} res - Express response object
 * @param {Error} err - Error object
 */
exports.errorHandler = (res, err) => {
  console.error("Error:", err);

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = {};

    // Extract validation error messages
    for (const field in err.errors) {
      errors[field] = err.errors[field].message;
    }

    return res.status(400).json({
      message: "Validation error",
      errors,
    });
  }

  // Handle Mongoose cast errors (invalid IDs, etc.)
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format",
    });
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      message: `Duplicate value: ${field} already exists`,
    });
  }

  // Default server error response
  return res.status(500).json({
    message: "Server error",
    error:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
};
