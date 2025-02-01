const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: [true, 'Mensagem não pode estar vazia'],
        maxlength: [500, 'Mensagem não pode ter mais que 500 caracteres']
    },
    readAt: Date,
    type: {
        type: String,
        enum: ['text', 'system'],
        default: 'text'
    }
}, {
    timestamps: true
});

const chatSchema = new mongoose.Schema({
    model: {
        type: mongoose.Schema.ObjectId,
        ref: 'Model',
        required: true
    },
    client: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [messageSchema],
    status: {
        type: String,
        enum: ['active', 'blocked', 'expired', 'closed'],
        default: 'active'
    },
    messageCount: {
        type: Number,
        default: 0
    },
    lastMessage: {
        type: Date,
        default: Date.now
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 90 * 24 * 60 * 60 * 1000) // 90 dias
    },
    blockedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    blockReason: String,
    clientMessageCount: {
        type: Number,
        default: 0
    },
    modelMessageCount: {
        type: Number,
        default: 0
    },
    lastClientMessage: Date,
    lastModelMessage: Date,
    paymentStatus: {
        type: String,
        enum: ['none', 'pending', 'completed', 'failed'],
        default: 'none'
    },
    paymentAmount: {
        type: Number,
        default: 0
    },
    paymentId: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware para atualizar messageCount e lastMessage
chatSchema.pre('save', function(next) {
    if (this.messages && this.messages.length > 0) {
        this.messageCount = this.messages.length;
        this.lastMessage = this.messages[this.messages.length - 1].createdAt;
    }
    next();
});

// Método para verificar se o cliente pode enviar mensagem
chatSchema.methods.canSendMessage = function(userId) {
    // Se o chat não estiver ativo
    if (this.status !== 'active') {
        return {
            canSend: false,
            reason: `Chat ${this.status}`
        };
    }

    // Se o chat estiver expirado
    if (new Date() > this.expiresAt) {
        return {
            canSend: false,
            reason: 'Chat expirado'
        };
    }

    // Se for a modelo, sempre pode enviar
    if (this.model.toString() === userId.toString()) {
        return { canSend: true };
    }

    // Se for o cliente
    if (this.client.toString() === userId.toString()) {
        // Se não for pago e já atingiu o limite de 5 mensagens
        if (!this.isPaid && this.clientMessageCount >= 5) {
            return {
                canSend: false,
                reason: 'Limite de mensagens atingido. Faça um pagamento para continuar.'
            };
        }
    }

    return { canSend: true };
};

// Método para verificar se um usuário pode ler o chat
chatSchema.methods.canAccessChat = function(userId) {
    return this.model.toString() === userId.toString() || 
           this.client.toString() === userId.toString();
};

// Método para bloquear o chat
chatSchema.methods.block = async function(userId, reason) {
    this.status = 'blocked';
    this.blockedBy = userId;
    this.blockReason = reason;
    await this.save();

    // Adiciona mensagem do sistema sobre o bloqueio
    this.messages.push({
        sender: userId,
        content: `Chat bloqueado: ${reason}`,
        type: 'system'
    });

    return this;
};

// Método para desbloquear o chat
chatSchema.methods.unblock = async function() {
    this.status = 'active';
    this.blockedBy = undefined;
    this.blockReason = undefined;
    await this.save();

    // Adiciona mensagem do sistema sobre o desbloqueio
    this.messages.push({
        sender: this.model,
        content: 'Chat desbloqueado',
        type: 'system'
    });

    return this;
};

// Índices
chatSchema.index({ model: 1, client: 1 });
chatSchema.index({ status: 1 });
chatSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Chat', chatSchema);
