const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  subscriber: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Assinatura deve ter um assinante']
  },
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Assinatura deve ter um creator']
  },
  plan: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: [true, 'Por favor, selecione um plano']
  },
  price: {
    type: Number,
    required: [true, 'Assinatura deve ter um preço']
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active'
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  lastPayment: {
    type: Date,
    default: Date.now
  },
  nextPayment: Date,
  paymentHistory: [{
    amount: Number,
    date: Date,
    status: {
      type: String,
      enum: ['successful', 'failed', 'pending', 'refunded']
    },
    transactionId: String
  }],
  cancelReason: {
    type: String,
    enum: ['price', 'content', 'service', 'other'],
    select: false
  },
  cancelFeedback: {
    type: String,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
subscriptionSchema.index({ subscriber: 1, creator: 1 }, { unique: true });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });

// Middleware para atualizar updatedAt
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware para definir endDate baseado no plano
subscriptionSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('plan')) {
    const now = new Date();
    switch (this.plan) {
      case 'monthly':
        this.endDate = new Date(now.setMonth(now.getMonth() + 1));
        break;
      case 'quarterly':
        this.endDate = new Date(now.setMonth(now.getMonth() + 3));
        break;
      case 'yearly':
        this.endDate = new Date(now.setFullYear(now.getFullYear() + 1));
        break;
    }
    this.nextPayment = this.endDate;
  }
  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
