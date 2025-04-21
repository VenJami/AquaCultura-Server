/**
 * Wrapper for async controller functions to catch errors
 * and pass them to the error middleware
 * 
 * @param {Function} fn - The async function to wrap
 * @returns {Function} - Express middleware function
 */
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}; 