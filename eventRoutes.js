const express = require('express');
const router = express.Router();
// Make sure to import the new deleteEvent and updateEvent functions here!
const { createEvent, getEvents, markInterested, deleteEvent, updateEvent } = require('../controllers/eventController');

router.post('/', createEvent);
router.get('/', getEvents);
router.put('/:id', updateEvent); // <-- The new Update Route
router.put('/:id/interested', markInterested);
router.delete('/:id', deleteEvent); // <-- The new Delete Route

module.exports = router;