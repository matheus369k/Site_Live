const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    preferences: {
        favoriteModels: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Model'
        }],
        blockedModels: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Model'
        }],
        notificationPreferences: {
            email: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: false
            },
            push: {
                type: Boolean,
                default: true
            }
        }
    },
    paymentMethods: [{
        type: {
            type: String,
            enum: ['credit_card', 'pix'],
            required: true
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        lastFour: String,
        brand: String,
        expiryMonth: Number,
        expiryYear: Number,
        stripePaymentMethodId: String
    }],
    stats: {
        totalSessions: {
            type: Number,
            default: 0
        },
        totalSpent: {
            type: Number,
            default: 0
        },
        lastSession: Date
    },
    verificationStatus: {
        emailVerified: {
            type: Boolean,
            default: false
        },
        phoneVerified: {
            type: Boolean,
            default: false
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Middleware para garantir apenas um método de pagamento padrão
clientSchema.pre('save', async function(next) {
    if (this.isModified('paymentMethods')) {
        const defaultMethods = this.paymentMethods.filter(method => method.isDefault);
        if (defaultMethods.length > 1) {
            const [first, ...rest] = defaultMethods;
            rest.forEach(method => method.isDefault = false);
        }
    }
    next();
});

module.exports = mongoose.model('Client', clientSchema);
