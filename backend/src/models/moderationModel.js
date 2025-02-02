const mongoose = require('mongoose');

const moderationSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  moderatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: String,
  reviewedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Moderation', moderationSchema);
