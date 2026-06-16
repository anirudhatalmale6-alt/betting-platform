const express = require('express');
const router = express.Router();
const betController = require('../controllers/betController');
const { auth, requireRole } = require('../middleware/auth');

router.post('/place', auth, requireRole('player'), betController.placeBet);
router.get('/my', auth, betController.getUserBets);
router.get('/all', auth, requireRole('admin', 'bookmaker'), betController.getAllBets);
router.post('/settle', auth, requireRole('admin', 'bookmaker'), betController.settleBet);
router.post('/settle-market', auth, requireRole('admin', 'bookmaker'), betController.settleMarket);

module.exports = router;
