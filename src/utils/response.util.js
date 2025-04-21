/**
 * Standardized success response for API endpoints
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {*} data - Data to return (optional)
 * @param {Number} statusCode - HTTP status code (default: 200)
 * @returns {Object} JSON response
 */
exports.successResponse = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standardized error response for API endpoints
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {Error} error - Error object (optional)
 * @returns {Object} JSON response
 */
exports.errorResponse = (res, message, statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
  };

  // Include error details in development environment
  if (error && process.env.NODE_ENV !== 'production') {
    response.error = error.message || String(error);
    if (error.stack) {
      response.stack = error.stack;
    }
  }

  return res.status(statusCode).json(response);
}; 