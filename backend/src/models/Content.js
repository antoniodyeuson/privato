const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Conteúdo deve pertencer a um creator']
  },
  title: {
    type: String,
    required: [true, 'Por favor, forneça um título']
  },
  description: {
    type: String,
    required: [true, 'Por favor, forneça uma descrição']
  },
  type: {
    type: String,
    enum: ['image', 'video', 'text', 'audio'],
    required: [true, 'Por favor, especifique o tipo de conteúdo']
  },
  files: [{
    url: String,
    type: String,
    size: Number,
    thumbnail: String
  }],
  price: {
    type: Number,
    required: [true, 'Por favor, defina um preço']
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft'
  },
  publishDate: {
    type: Date
  },
  tags: [String],
  category: {
    type: String,
    required: [true, 'Por favor, selecione uma categoria']
  },
  stats: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    earnings: {
      type: Number,
      default: 0
    }
  },
  comments: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  watermark: {
    enabled: {
      type: Boolean,
      default: true
    },
    text: String,
    position: {
      type: String,
      enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'],
      default: 'bottom-right'
    }
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
contentSchema.index({ creator: 1, createdAt: -1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ status: 1 });

// Virtual populate
contentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

contentSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Middleware para atualizar updatedAt
contentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Content = mongoose.model('Content', contentSchema);
module.exports = Content;
