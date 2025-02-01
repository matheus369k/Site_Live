const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
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
    service: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    refundId: String,
    refundReason: String,
    metadata: {
        type: Map,
        of: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Índices
paymentSchema.index({ model: 1, createdAt: -1 });
paymentSchema.index({ client: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

// Métodos estáticos
paymentSchema.statics.getModelEarnings = async function(modelId, startDate, endDate) {
    const earnings = await this.aggregate([
        {
            $match: {
                model: mongoose.Types.ObjectId(modelId),
                status: 'completed',
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    return earnings[0] || { total: 0, count: 0 };
};

paymentSchema.statics.getClientSpending = async function(clientId, startDate, endDate) {
    const spending = await this.aggregate([
        {
            $match: {
                client: mongoose.Types.ObjectId(clientId),
                status: 'completed',
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    return spending[0] || { total: 0, count: 0 };
};

module.exports = mongoose.model('Payment', paymentSchema);
