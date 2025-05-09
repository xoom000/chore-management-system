const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Notification routes
router.get('/', notificationController.getUserNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.post('/', notificationController.createNotification);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;