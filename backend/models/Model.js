const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Por favor, adicione uma descrição'],
        maxlength: [500, 'Descrição não pode ter mais que 500 caracteres']
    },
    location: {
        state: {
            type: String,
            required: [true, 'Por favor, adicione um estado'],
            enum: [
                'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
                'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
                'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
            ]
        },
        city: {
            type: String,
            required: [true, 'Por favor, adicione uma cidade']
        }
    },
    photos: [{
        url: {
            type: String,
            required: true
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    services: [{
        name: {
            type: String,
            required: true
        },
        description: String,
        duration: {
            type: Number, // em minutos
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    pricing: {
        hourlyRate: {
            type: Number,
            required: [true, 'Por favor, adicione um valor por hora']
        },
        minimumTime: {
            type: Number,
            default: 60, // em minutos
            required: true
        }
    },
    availability: {
        schedule: [{
            dayOfWeek: {
                type: Number, // 0-6 (Domingo-Sábado)
                required: true
            },
            startTime: {
                type: String, // formato HH:mm
                required: true
            },
            endTime: {
                type: String, // formato HH:mm
                required: true
            }
        }],
        customDates: [{
            date: Date,
            available: Boolean,
            startTime: String,
            endTime: String
        }]
    },
    stats: {
        totalSessions: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        reviewCount: {
            type: Number,
            default: 0
        }
    },
    preferences: {
        maxConcurrentClients: {
            type: Number,
            default: 1
        },
        allowInstantBooking: {
            type: Boolean,
            default: false
        },
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
    verificationStatus: {
        documentsVerified: {
            type: Boolean,
            default: false
        },
        phoneVerified: {
            type: Boolean,
            default: false
        },
        emailVerified: {
            type: Boolean,
            default: false
        },
        backgroundCheck: {
            type: Boolean,
            default: false
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual para calcular a média de avaliações
modelSchema.virtual('averageRating').get(function() {
    return this.stats.reviewCount > 0 ? this.stats.rating / this.stats.reviewCount : 0;
});

// Middleware para garantir que apenas uma foto seja primária
modelSchema.pre('save', async function(next) {
    if (this.isModified('photos')) {
        const primaryPhotos = this.photos.filter(photo => photo.isPrimary);
        if (primaryPhotos.length > 1) {
            const [first, ...rest] = primaryPhotos;
            rest.forEach(photo => photo.isPrimary = false);
        }
    }
    next();
});

module.exports = mongoose.model('Model', modelSchema);
