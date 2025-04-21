const { body } = require('express-validator');

exports.validateEvent = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),

  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/)
    .withMessage('Invalid time format. Use HH:MM AM/PM'),

  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/)
    .withMessage('Invalid time format. Use HH:MM AM/PM')
    .custom((value, { req }) => {
      const startTime = new Date(`2000-01-01 ${req.body.startTime}`);
      const endTime = new Date(`2000-01-01 ${value}`);
      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  body('type')
    .notEmpty()
    .withMessage('Event type is required')
    .isIn(['Planting', 'Harvesting', 'Maintenance', 'Team Meeting'])
    .withMessage('Invalid event type'),

  body('status')
    .optional()
    .isIn(['Pending', 'Confirmed', 'Completed'])
    .withMessage('Invalid status'),

  body('assignee')
    .trim()
    .notEmpty()
    .withMessage('Assignee is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Assignee name must be between 2 and 50 characters')
]; 