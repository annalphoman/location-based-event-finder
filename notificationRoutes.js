const express = require('express');
const router = express.Router();
const { getUserNotifications, markAsRead, deleteNotification } = require('../controllers/notificationController');

router.get('/:userId', getUserNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;