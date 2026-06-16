const express = require('express');
const router = express.Router();
const casinoController = require('../controllers/casinoController');
const { auth } = require('../middleware/auth');

router.get('/games', casinoController.getGames);
router.post('/bet', auth, casinoController.placeCasinoBet);
router.get('/history', auth, casinoController.getCasinoHistory);

module.exports = router;
