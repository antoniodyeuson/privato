const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Mensagem deve ter um remetente']
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Mensagem deve ter um destinatário']
  },
  content: {
    type: String,
    required: [true, 'Mensagem não pode estar vazia']
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'file']
    },
    url: String,
    name: String,
    size: Number,
    thumbnail: String
  }],
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isPaid: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  deletedBySender: {
    type: Boolean,
    default: false
  },
  deletedByRecipient: {
    type: Boolean,
    default: false
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ read: 1 });

// Middleware para atualizar updatedAt
messageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware para atualizar readAt quando a mensagem é lida
messageSchema.pre('save', function(next) {
  if (this.isModified('read') && this.read) {
    this.readAt = Date.now();
    this.status = 'read';
  }
  next();
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
