const express = require('express');
const { auth } = require('../middlewares/auth');
const {
    listNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteNotification,
    deleteReadNotifications
} = require('../controllers/notificationController');

const router = express.Router();

// Todas as rotas são privadas
router.use(auth);

// Rotas
router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/read', deleteReadNotifications);

module.exports = router;
