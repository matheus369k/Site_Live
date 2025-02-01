const notificationService = require('../services/notificationService');

// @desc    Listar notificações do usuário
// @route   GET /api/notifications
// @access  Private
exports.listNotifications = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            read,
            type,
            priority,
            startDate,
            endDate
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            read: read === 'true' ? true : read === 'false' ? false : undefined,
            type,
            priority,
            startDate,
            endDate
        };

        const result = await notificationService.listNotifications(
            req.user.id,
            options
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar notificações',
            error: error.message
        });
    }
};

// @desc    Marcar notificação como lida
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await notificationService.markAsRead(
            req.params.id,
            req.user.id
        );

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao marcar notificação como lida',
            error: error.message
        });
    }
};

// @desc    Marcar todas as notificações como lidas
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        await notificationService.markAllAsRead(req.user.id);

        res.status(200).json({
            success: true,
            message: 'Todas as notificações foram marcadas como lidas'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao marcar notificações como lidas',
            error: error.message
        });
    }
};

// @desc    Obter contagem de notificações não lidas
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await notificationService.getUnreadCount(req.user.id);

        res.status(200).json({
            success: true,
            data: { count }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter contagem de notificações',
            error: error.message
        });
    }
};

// @desc    Excluir notificação
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notificação não encontrada'
            });
        }

        await notification.remove();

        res.status(200).json({
            success: true,
            message: 'Notificação excluída com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao excluir notificação',
            error: error.message
        });
    }
};

// @desc    Excluir todas as notificações lidas
// @route   DELETE /api/notifications/read
// @access  Private
exports.deleteReadNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({
            user: req.user.id,
            read: true
        });

        res.status(200).json({
            success: true,
            message: 'Notificações lidas excluídas com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao excluir notificações',
            error: error.message
        });
    }
};
