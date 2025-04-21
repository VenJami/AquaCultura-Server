/**
 * Generates an array of dates based on a repeat pattern, between start and end dates
 * @param {Object} pattern - The repeat pattern object
 * @param {Date} startDate - The start date
 * @param {Date} endDate - The end date
 * @returns {Array<Date>} Array of dates matching the pattern
 */
function generateDatesFromPattern(pattern, startDate, endDate) {
  if (!pattern || !startDate || !endDate) {
    throw new Error('Pattern, start date, and end date are required');
  }
  
  // Ensure we have Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Initialize array for generated dates
  const dates = [];
  
  // Current date to check, starting from the start date
  const currentDate = new Date(start);
  
  // Reset the time to the beginning of the day for consistent comparison
  currentDate.setHours(0, 0, 0, 0);
  
  // Process until we reach the end date
  while (currentDate <= end) {
    if (matchesPattern(currentDate, pattern)) {
      dates.push(new Date(currentDate));
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Checks if a date matches a repeat pattern
 * @param {Date} date - The date to check
 * @param {Object} pattern - The repeat pattern
 * @returns {boolean} True if the date matches the pattern
 */
function matchesPattern(date, pattern) {
  const { type } = pattern;
  
  switch (type) {
    case 'daily':
      return true;
      
    case 'weekly':
      // Check if the day of the week matches (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = date.getDay();
      return pattern.days.includes(dayOfWeek);
      
    case 'monthly':
      // Check if the day of the month matches
      const dayOfMonth = date.getDate();
      return dayOfMonth === pattern.dayOfMonth;
      
    case 'yearly':
      // Check if the month and day match
      const month = date.getMonth(); // 0-11
      const day = date.getDate();
      return month === pattern.month && day === pattern.dayOfMonth;
      
    default:
      return false;
  }
}

/**
 * Format a date to YYYY-MM-DD
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get an array of the next n days
 * @param {number} days - Number of days ahead
 * @param {Date} startDate - Starting date (defaults to today)
 * @returns {Array<Date>} Array of dates
 */
function getNextNDays(days, startDate = new Date()) {
  const dates = [];
  const current = new Date(startDate);
  
  for (let i = 0; i < days; i++) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

module.exports = {
  generateDatesFromPattern,
  matchesPattern,
  formatDate,
  getNextNDays
}; 