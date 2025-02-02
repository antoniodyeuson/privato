const mongoose = require('mongoose');

const viewHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Visualização precisa estar associada a um usuário']
    },
    content: {
        type: mongoose.Schema.ObjectId,
        ref: 'Content',
        required: [true, 'Visualização precisa estar associada a um conteúdo']
    },
    viewedAt: {
        type: Date,
        default: Date.now
    }
});

// Índice para melhorar performance de consultas
viewHistorySchema.index({ user: 1, viewedAt: -1 });

const ViewHistory = mongoose.model('ViewHistory', viewHistorySchema);

module.exports = ViewHistory;
