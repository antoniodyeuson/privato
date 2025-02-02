const mongoose = require('mongoose');
const path = require('path');

const contentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Um título é obrigatório'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Uma descrição é obrigatória'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Um preço é obrigatório'],
        min: [0, 'O preço não pode ser negativo']
    },
    type: {
        type: String,
        required: true,
        enum: ['image', 'video'],
        default: 'image'
    },
    creator: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    file: {
        type: String,
        required: [true, 'Um arquivo é obrigatório']
    },
    tags: [{
        type: String,
        trim: true
    }],
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices
contentSchema.index({ creator: 1, createdAt: -1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ status: 1 });

// Hooks
contentSchema.pre('save', function(next) {
    // Validar extensões de arquivo permitidas
    const allowedImageExts = ['.jpg', '.jpeg', '.png', '.gif'];
    const allowedVideoExts = ['.mp4', '.webm'];
    const fileExt = path.extname(this.file).toLowerCase();
    
    if (this.type === 'image' && !allowedImageExts.includes(fileExt)) {
        next(new Error('Formato de imagem inválido. Use: jpg, jpeg, png ou gif'));
    }
    
    if (this.type === 'video' && !allowedVideoExts.includes(fileExt)) {
        next(new Error('Formato de vídeo inválido. Use: mp4 ou webm'));
    }
    
    next();
});

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
