const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Uma compra precisa ter um usuário']
    },
    content: {
        type: mongoose.Schema.ObjectId,
        ref: 'Content',
        required: [true, 'Uma compra precisa ter um conteúdo']
    },
    creator: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Uma compra precisa ter um criador']
    },
    price: {
        type: Number,
        required: [true, 'Uma compra precisa ter um preço']
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices
purchaseSchema.index({ user: 1, content: 1 }, { unique: true });

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase;
