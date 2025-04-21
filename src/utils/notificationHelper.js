/**
 * Notification helper utility to easily create notifications
 * from various parts of the application
 */

const notificationController = require('../controllers/notification.controller');

/**
 * Create a notification for all admin users
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Type: 'alert', 'warning', 'info', 'task', 'system', 'user'
 * @param {string} actionUrl - URL to navigate to when clicking the notification (optional)
 * @returns {Promise<Object[]>} Array of created notifications
 */
exports.notifyAdmins = async (title, message, type, actionUrl = null) => {
  const notificationData = {
    title,
    message,
    type,
    actionUrl,
    isRead: false
  };
  
  return await notificationController.createAdminNotification(notificationData);
};

/**
 * Create a notification for a specific user
 * @param {string} userId - User ID to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Type: 'alert', 'warning', 'info', 'task', 'system', 'user'
 * @param {string} actionUrl - URL to navigate to when clicking the notification (optional)
 * @returns {Promise<Object>} Created notification
 */
exports.notifyUser = async (userId, title, message, type, actionUrl = null) => {
  const notificationData = {
    title,
    message,
    type,
    actionUrl,
    isRead: false
  };
  
  return await notificationController.createUserNotification(userId, notificationData);
};

// Convenience methods for different notification types

/**
 * Send alert notification to admins
 */
exports.adminAlert = async (title, message, actionUrl = null) => {
  return await this.notifyAdmins(title, message, 'alert', actionUrl);
};

/**
 * Send warning notification to admins
 */
exports.adminWarning = async (title, message, actionUrl = null) => {
  return await this.notifyAdmins(title, message, 'warning', actionUrl);
};

/**
 * Send info notification to admins
 */
exports.adminInfo = async (title, message, actionUrl = null) => {
  return await this.notifyAdmins(title, message, 'info', actionUrl);
};

/**
 * Send system notification to admins
 */
exports.adminSystem = async (title, message, actionUrl = null) => {
  return await this.notifyAdmins(title, message, 'system', actionUrl);
};

/**
 * Send task notification to admins
 */
exports.adminTask = async (title, message, actionUrl = null) => {
  return await this.notifyAdmins(title, message, 'task', actionUrl);
};

/**
 * Send user notification to admins
 */
exports.adminUserNotification = async (title, message, actionUrl = null) => {
  return await this.notifyAdmins(title, message, 'user', actionUrl);
};

/**
 * Send task completion notification to a user
 * @param {string} userId - ID of the user who completed the task
 * @param {string} taskTitle - Title of the completed task
 * @param {string} taskId - ID of the completed task
 * @returns {Promise<Object>} Created notification
 */
exports.taskCompletionSuccess = async (userId, taskTitle, taskId) => {
  return await this.notifyUser(
    userId,
    `Task Completed Successfully: ${taskTitle}`,
    `You have successfully completed the task: ${taskTitle}. Great job!`,
    'task',
    `/tasks/${taskId}`
  );
};

/**
 * Notify a team about a task completion
 * @param {Array<string>} teamMemberIds - Array of user IDs in the team
 * @param {string} completedByName - Name of the user who completed the task
 * @param {string} taskTitle - Title of the completed task
 * @param {string} taskId - ID of the completed task
 * @param {string} excludeUserId - Optional user ID to exclude from the notification (usually the completer)
 * @returns {Promise<Array<Object>>} Created notifications
 */
exports.notifyTeamTaskCompletion = async (teamMemberIds, completedByName, taskTitle, taskId, excludeUserId = null) => {
  const notifications = [];
  
  for (const memberId of teamMemberIds) {
    if (excludeUserId && memberId === excludeUserId) continue;
    
    const notification = await this.notifyUser(
      memberId,
      `Team Task Completed: ${taskTitle}`,
      `${completedByName} has completed the team task: ${taskTitle}`,
      'task',
      `/tasks/${taskId}`
    );
    
    notifications.push(notification);
  }
  
  return notifications;
};

/**
 * Notify a user about an upcoming task deadline
 * @param {string} userId - ID of the user to notify
 * @param {string} taskTitle - Title of the task
 * @param {Date} dueDate - Due date of the task
 * @param {string} taskId - ID of the task
 * @returns {Promise<Object>} Created notification
 */
exports.taskDueReminder = async (userId, taskTitle, dueDate, taskId) => {
  const formattedDate = dueDate.toLocaleDateString('en-US', {
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
  
  return await this.notifyUser(
    userId,
    `Task Due Soon: ${taskTitle}`,
    `Your task "${taskTitle}" is due on ${formattedDate}. Please complete it on time.`,
    'warning',
    `/tasks/${taskId}`
  );
}; 