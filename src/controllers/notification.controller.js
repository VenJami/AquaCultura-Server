const Notification = require('../models/notification');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get all notifications for a specific user
 */
exports.getUserNotifications = catchAsync(async (req, res, next) => {
  const userId = req.user.id; // From auth middleware
  
  const notifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(100); // Limit to recent 100 notifications for performance
  
  res.status(200).json({
    status: 'success',
    results: notifications.length,
    data: {
      notifications
    }
  });
});

/**
 * Get all notifications for admin dashboard
 * (This is an admin-only endpoint)
 */
exports.getAllNotifications = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return next(new AppError('Not authorized to access this resource', 403));
  }
  
  const notifications = await Notification.find()
    .sort({ createdAt: -1 })
    .limit(200); // Limit for performance
  
  res.status(200).json({
    status: 'success',
    results: notifications.length,
    data: {
      notifications
    }
  });
});

/**
 * Mark notification as read
 */
exports.markAsRead = catchAsync(async (req, res, next) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  const notification = await Notification.findOne({ 
    _id: notificationId,
    recipient: userId
  });
  
  if (!notification) {
    return next(new AppError('Notification not found or not authorized', 404));
  }
  
  notification.isRead = true;
  await notification.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      notification
    }
  });
});

/**
 * Mark all notifications as read for a user
 */
exports.markAllAsRead = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
  
  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read'
  });
});

/**
 * Delete a notification
 */
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  const notification = await Notification.findOne({ 
    _id: notificationId,
    recipient: userId
  });
  
  if (!notification) {
    return next(new AppError('Notification not found or not authorized', 404));
  }
  
  // Use deleteOne instead of remove() which is deprecated
  await Notification.deleteOne({ _id: notificationId });
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * Create a notification for admin users
 * This is used internally by other controllers to create notifications
 * @param {Object} notificationData - The notification data
 * @returns {Promise<Object>} The created notification
 */
exports.createAdminNotification = async (notificationData) => {
  try {
    // Find all admin users
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'superadmin'] } 
    });
    
    if (!adminUsers || adminUsers.length === 0) {
      console.log('No admin users found to notify');
      return null;
    }
    
    // Create notifications for each admin
    const notifications = [];
    
    for (const admin of adminUsers) {
      const notification = await Notification.create({
        ...notificationData,
        recipient: admin._id
      });
      
      notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error creating admin notification:', error);
    return null;
  }
};

/**
 * Create a user notification
 * This is used internally by other controllers to create notifications
 * @param {string} userId - The user ID to notify
 * @param {Object} notificationData - The notification data
 * @returns {Promise<Object>} The created notification
 */
exports.createUserNotification = async (userId, notificationData) => {
  try {
    const notification = await Notification.create({
      ...notificationData,
      recipient: userId
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating user notification:', error);
    return null;
  }
}; 