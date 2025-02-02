const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Favorito precisa estar associado a um usuário']
    },
    content: {
        type: mongoose.Schema.ObjectId,
        ref: 'Content',
        required: [true, 'Favorito precisa estar associado a um conteúdo']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Índice composto para evitar duplicatas
favoriteSchema.index({ user: 1, content: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
