const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/sports', eventController.getSports);
router.get('/tournaments', eventController.getTournaments);
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventDetail);
router.post('/', auth, requireRole('admin', 'bookmaker'), eventController.createEvent);
router.put('/:id', auth, requireRole('admin', 'bookmaker'), eventController.updateEvent);

module.exports = router;
