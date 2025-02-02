const mongoose = require('mongoose');

const notificationPrefSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  preferences: {
    purchase: { type: Boolean, default: true },
    reward: { type: Boolean, default: true },
    system: { type: Boolean, default: true },
    moderation: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('NotificationPref', notificationPrefSchema);
