const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth, requireRole('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.post('/users/:id/balance', adminController.adjustBalance);
router.get('/transactions', adminController.getTransactions);
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);
router.get('/announcements', adminController.getAnnouncements);
router.post('/announcements', adminController.createAnnouncement);
router.get('/activity-log', adminController.getActivityLog);

module.exports = router;
