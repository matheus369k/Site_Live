const mongoose = require('mongoose');

const videoCallSchema = new mongoose.Schema({
    model: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Model',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    roomName: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    scheduledFor: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // em minutos
        required: true
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    modelJoinedAt: Date,
    clientJoinedAt: Date,
    endedAt: Date,
    actualDuration: Number, // em minutos
    endReason: {
        type: String,
        enum: ['completed', 'timeout', 'cancelled_by_model', 'cancelled_by_client', 'technical_issue'],
    },
    rating: {
        score: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        createdAt: Date
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Índices
videoCallSchema.index({ model: 1, scheduledFor: 1 });
videoCallSchema.index({ client: 1, scheduledFor: 1 });
videoCallSchema.index({ status: 1 });

// Métodos estáticos
videoCallSchema.statics.getUpcoming = async function(userId, isModel = false) {
    const query = {
        [isModel ? 'model' : 'client']: userId,
        status: { $in: ['scheduled', 'in_progress'] },
        scheduledFor: { $gte: new Date() }
    };

    return this.find(query)
        .sort('scheduledFor')
        .populate('model client', 'name')
        .populate('payment', 'amount status');
};

videoCallSchema.statics.getHistory = async function(userId, isModel = false) {
    const query = {
        [isModel ? 'model' : 'client']: userId,
        status: { $in: ['completed', 'cancelled'] }
    };

    return this.find(query)
        .sort('-scheduledFor')
        .populate('model client', 'name')
        .populate('payment', 'amount status');
};

// Métodos de instância
videoCallSchema.methods.start = async function() {
    if (this.status !== 'scheduled') {
        throw new Error('Chamada não está agendada');
    }

    this.status = 'in_progress';
    return this.save();
};

videoCallSchema.methods.end = async function(reason) {
    if (this.status !== 'in_progress') {
        throw new Error('Chamada não está em andamento');
    }

    this.status = 'completed';
    this.endedAt = new Date();
    this.endReason = reason;
    
    // Calcula a duração real
    const startTime = Math.min(
        this.modelJoinedAt.getTime(),
        this.clientJoinedAt.getTime()
    );
    this.actualDuration = Math.floor((this.endedAt.getTime() - startTime) / (1000 * 60));

    return this.save();
};

videoCallSchema.methods.addRating = async function(score, comment) {
    if (this.status !== 'completed') {
        throw new Error('Só é possível avaliar chamadas concluídas');
    }

    this.rating = {
        score,
        comment,
        createdAt: new Date()
    };

    return this.save();
};

module.exports = mongoose.model('VideoCall', videoCallSchema);
