const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Um follow deve ter um usuário']
    },
    creator: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Um follow deve ter um criador']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices compostos
followSchema.index({ user: 1, creator: 1 }, { unique: true });

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;
