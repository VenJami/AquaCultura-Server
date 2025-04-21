const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { validateEvent } = require('../middleware/event.validation');

// Create a new event
router.post('/', validateEvent, eventController.createEvent);

// Get all events with optional filters
router.get('/', eventController.getEvents);

// Get a single event by ID
router.get('/:id', eventController.getEvent);

// Update an event
router.put('/:id', validateEvent, eventController.updateEvent);

// Delete an event
router.delete('/:id', eventController.deleteEvent);

module.exports = router; 