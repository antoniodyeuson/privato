const mongoose = require('mongoose');

const loyaltySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, default: 0 },
  tier: { type: String, enum: ['bronze', 'silver', 'gold'], default: 'bronze' },
  rewardsRedeemed: [{
    rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward' },
    redeemedAt: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('Loyalty', loyaltySchema);
