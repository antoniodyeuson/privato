const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Pagamento deve ter um pagador']
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Pagamento deve ter um destinatário']
  },
  amount: {
    type: Number,
    required: [true, 'Pagamento deve ter um valor']
  },
  currency: {
    type: String,
    default: 'BRL'
  },
  type: {
    type: String,
    enum: ['subscription', 'tip', 'content', 'message'],
    required: [true, 'Tipo de pagamento deve ser especificado']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['credit_card', 'debit_card', 'crypto', 'pix', 'bank_transfer']
    },
    details: {
      last4: String,
      brand: String,
      expiryMonth: Number,
      expiryYear: Number
    }
  },
  relatedItem: {
    type: mongoose.Schema.ObjectId,
    refPath: 'itemType'
  },
  itemType: {
    type: String,
    enum: ['Subscription', 'Content', 'Message']
  },
  platformFee: {
    type: Number,
    required: true
  },
  creatorEarnings: {
    type: Number,
    required: true
  },
  refundReason: {
    type: String,
    select: false
  },
  metadata: {
    type: Map,
    of: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  refundedAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
paymentSchema.index({ payer: 1, recipient: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ type: 1 });

// Middleware para calcular taxas e ganhos
paymentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('amount')) {
    // Calcula taxa da plataforma (20%)
    this.platformFee = this.amount * 0.2;
    // Calcula ganhos do creator (80%)
    this.creatorEarnings = this.amount * 0.8;
  }
  next();
});

// Middleware para atualizar timestamps
paymentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed') {
      this.completedAt = Date.now();
    } else if (this.status === 'refunded') {
      this.refundedAt = Date.now();
    }
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
