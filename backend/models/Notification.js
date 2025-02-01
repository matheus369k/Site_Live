const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: [
            'payment_received',
            'payment_sent',
            'new_message',
            'call_scheduled',
            'call_reminder',
            'call_started',
            'call_ended',
            'profile_verified',
            'profile_rejected',
            'account_warning',
            'account_blocked'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    expiresAt: Date,
    actions: [{
        label: String,
        url: String,
        type: {
            type: String,
            enum: ['link', 'button']
        }
    }]
}, {
    timestamps: true
});

// Índices
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Métodos estáticos
notificationSchema.statics.createNotification = async function(params) {
    const {
        user,
        type,
        title,
        message,
        data = {},
        priority = 'medium',
        expiresAt = null,
        actions = []
    } = params;

    const notification = await this.create({
        user,
        type,
        title,
        message,
        data,
        priority,
        expiresAt,
        actions
    });

    return notification;
};

notificationSchema.statics.getUnreadCount = async function(userId) {
    return this.countDocuments({
        user: userId,
        read: false
    });
};

notificationSchema.statics.markAllAsRead = async function(userId) {
    const now = new Date();
    return this.updateMany(
        {
            user: userId,
            read: false
        },
        {
            $set: {
                read: true,
                readAt: now
            }
        }
    );
};

// Métodos de instância
notificationSchema.methods.markAsRead = async function() {
    if (!this.read) {
        this.read = true;
        this.readAt = new Date();
        await this.save();
    }
    return this;
};

notificationSchema.methods.addAction = async function(action) {
    this.actions.push(action);
    return this.save();
};

// Middleware para enviar notificação via socket
notificationSchema.post('save', async function(doc) {
    try {
        const socketService = require('../services/socket');
        socketService.notifyUser(doc.user, 'notification', {
            notification: doc
        });
    } catch (error) {
        console.error('Erro ao enviar notificação via socket:', error);
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
