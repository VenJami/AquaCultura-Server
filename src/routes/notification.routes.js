const express = require('express');
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Protect all routes after this middleware - require authentication
router.use(authMiddleware.protect);

// Get user's notifications
router.get('/', notificationController.getUserNotifications);

// Get all notifications (admin only)
router.get('/all', notificationController.getAllNotifications);

// Mark a notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Delete a notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router; 