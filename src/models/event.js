const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  type: {
    type: String,
    enum: ['Planting', 'Harvesting', 'Maintenance', 'Team Meeting'],
    required: [true, 'Event type is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed'],
    default: 'Pending'
  },
  assignee: {
    type: String,
    required: [true, 'Assignee is required']
  }
}, {
  timestamps: true
});

// Index for efficient date-based queries
eventSchema.index({ date: 1 });

module.exports = mongoose.model('Event', eventSchema); 