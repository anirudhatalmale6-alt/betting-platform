const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', marketController.getMarkets);
router.post('/', auth, requireRole('admin', 'bookmaker'), marketController.createMarket);
router.put('/:id', auth, requireRole('admin', 'bookmaker'), marketController.updateMarket);
router.put('/odds/update', auth, requireRole('admin', 'bookmaker'), marketController.updateOdds);

module.exports = router;
