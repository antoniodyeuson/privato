const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  icon: String,
  criteria: {
    minSubscribers: Number,
    minEarnings: Number,
    contentType: String
  }
});

module.exports = mongoose.model('Badge', badgeSchema);
