const Notification = require('../models/Notification');
const socketService = require('./socket');

class NotificationService {
    // Criar notificação de pagamento recebido
    async notifyPaymentReceived(model, payment) {
        const amount = payment.amount.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        return await Notification.createNotification({
            user: model.user,
            type: 'payment_received',
            title: 'Pagamento Recebido',
            message: `Você recebeu um pagamento de ${amount}`,
            data: {
                paymentId: payment._id,
                amount: payment.amount,
                clientId: payment.client
            },
            priority: 'high',
            actions: [{
                label: 'Ver Detalhes',
                url: `/payments/${payment._id}`,
                type: 'link'
            }]
        });
    }

    // Criar notificação de pagamento enviado
    async notifyPaymentSent(client, payment) {
        const amount = payment.amount.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        return await Notification.createNotification({
            user: client._id,
            type: 'payment_sent',
            title: 'Pagamento Enviado',
            message: `Seu pagamento de ${amount} foi processado com sucesso`,
            data: {
                paymentId: payment._id,
                amount: payment.amount,
                modelId: payment.model
            },
            priority: 'medium'
        });
    }

    // Criar notificação de nova mensagem
    async notifyNewMessage(userId, message, chat) {
        return await Notification.createNotification({
            user: userId,
            type: 'new_message',
            title: 'Nova Mensagem',
            message: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
            data: {
                chatId: chat._id,
                messageId: message._id,
                senderId: message.sender
            },
            priority: 'medium',
            actions: [{
                label: 'Responder',
                url: `/chat/${chat._id}`,
                type: 'link'
            }]
        });
    }

    // Criar notificação de chamada agendada
    async notifyCallScheduled(userId, videoCall) {
        const date = new Date(videoCall.scheduledFor).toLocaleString('pt-BR');

        return await Notification.createNotification({
            user: userId,
            type: 'call_scheduled',
            title: 'Nova Videochamada Agendada',
            message: `Você tem uma videochamada agendada para ${date}`,
            data: {
                callId: videoCall._id,
                scheduledFor: videoCall.scheduledFor,
                duration: videoCall.duration
            },
            priority: 'high',
            actions: [{
                label: 'Ver Detalhes',
                url: `/calls/${videoCall._id}`,
                type: 'link'
            }]
        });
    }

    // Criar notificação de lembrete de chamada
    async notifyCallReminder(userId, videoCall) {
        const date = new Date(videoCall.scheduledFor).toLocaleString('pt-BR');

        return await Notification.createNotification({
            user: userId,
            type: 'call_reminder',
            title: 'Lembrete de Videochamada',
            message: `Sua videochamada começa em 5 minutos (${date})`,
            data: {
                callId: videoCall._id,
                scheduledFor: videoCall.scheduledFor,
                duration: videoCall.duration
            },
            priority: 'urgent',
            actions: [{
                label: 'Entrar na Chamada',
                url: `/calls/${videoCall._id}/join`,
                type: 'button'
            }]
        });
    }

    // Criar notificação de início de chamada
    async notifyCallStarted(userId, videoCall) {
        return await Notification.createNotification({
            user: userId,
            type: 'call_started',
            title: 'Videochamada Iniciada',
            message: 'Sua videochamada começou',
            data: {
                callId: videoCall._id,
                roomName: videoCall.roomName
            },
            priority: 'urgent',
            actions: [{
                label: 'Entrar Agora',
                url: `/calls/${videoCall._id}/join`,
                type: 'button'
            }]
        });
    }

    // Criar notificação de fim de chamada
    async notifyCallEnded(userId, videoCall) {
        const duration = videoCall.actualDuration || videoCall.duration;

        return await Notification.createNotification({
            user: userId,
            type: 'call_ended',
            title: 'Videochamada Encerrada',
            message: `Sua videochamada foi encerrada. Duração: ${duration} minutos`,
            data: {
                callId: videoCall._id,
                duration: duration,
                endReason: videoCall.endReason
            },
            priority: 'medium'
        });
    }

    // Criar notificação de perfil verificado
    async notifyProfileVerified(model) {
        return await Notification.createNotification({
            user: model.user,
            type: 'profile_verified',
            title: 'Perfil Verificado',
            message: 'Parabéns! Seu perfil foi verificado com sucesso.',
            priority: 'high',
            actions: [{
                label: 'Ver Perfil',
                url: '/profile',
                type: 'link'
            }]
        });
    }

    // Criar notificação de perfil rejeitado
    async notifyProfileRejected(model, reason) {
        return await Notification.createNotification({
            user: model.user,
            type: 'profile_rejected',
            title: 'Verificação de Perfil Rejeitada',
            message: `Seu perfil não foi verificado. Motivo: ${reason}`,
            priority: 'high',
            data: {
                reason
            },
            actions: [{
                label: 'Atualizar Perfil',
                url: '/profile/edit',
                type: 'link'
            }]
        });
    }

    // Criar notificação de advertência
    async notifyAccountWarning(userId, reason) {
        return await Notification.createNotification({
            user: userId,
            type: 'account_warning',
            title: 'Advertência',
            message: `Seu perfil recebeu uma advertência. Motivo: ${reason}`,
            priority: 'urgent',
            data: {
                reason
            },
            actions: [{
                label: 'Ver Políticas',
                url: '/policies',
                type: 'link'
            }]
        });
    }

    // Criar notificação de conta bloqueada
    async notifyAccountBlocked(userId, reason, duration) {
        return await Notification.createNotification({
            user: userId,
            type: 'account_blocked',
            title: 'Conta Bloqueada',
            message: `Sua conta foi bloqueada por ${duration} dias. Motivo: ${reason}`,
            priority: 'urgent',
            data: {
                reason,
                duration,
                unblockDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
            },
            actions: [{
                label: 'Contatar Suporte',
                url: '/support',
                type: 'link'
            }]
        });
    }

    // Marcar notificação como lida
    async markAsRead(notificationId, userId) {
        const notification = await Notification.findOne({
            _id: notificationId,
            user: userId
        });

        if (!notification) {
            throw new Error('Notificação não encontrada');
        }

        return notification.markAsRead();
    }

    // Marcar todas as notificações como lidas
    async markAllAsRead(userId) {
        return Notification.markAllAsRead(userId);
    }

    // Obter contagem de notificações não lidas
    async getUnreadCount(userId) {
        return Notification.getUnreadCount(userId);
    }

    // Listar notificações do usuário
    async listNotifications(userId, options = {}) {
        const {
            page = 1,
            limit = 20,
            read,
            type,
            priority,
            startDate,
            endDate
        } = options;

        const query = { user: userId };

        if (typeof read === 'boolean') {
            query.read = read;
        }

        if (type) {
            query.type = type;
        }

        if (priority) {
            query.priority = priority;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Notification.countDocuments(query)
        ]);

        return {
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
}

module.exports = new NotificationService();
