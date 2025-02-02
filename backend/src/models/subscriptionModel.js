const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Assinatura precisa ter um assinante']
    },
    creator: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Assinatura precisa ter um criador']
    },
    plan: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly'
    },
    price: {
        type: Number,
        required: [true, 'Preço é obrigatório']
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired'],
        default: 'active'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    autoRenew: {
        type: Boolean,
        default: true
    },
    cancelReason: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices
subscriptionSchema.index({ subscriber: 1, creator: 1 }, { unique: true });
subscriptionSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
