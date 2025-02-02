const Notification = require('../models/notificationModel');
const NotificationPref = require('../models/notificationPrefModel');
const { broadcast } = require('../utils/websocket');

const createNotification = async (userId, type, message, metadata = {}) => {
  const pref = await NotificationPref.findOne({ user: userId });
  if (pref && !pref.preferences[type]) return null;
  
  const notification = await Notification.create({
    user: userId,
    type,
    message,
    metadata
  });
  broadcast({ type: 'notification', data: notification });
  return notification;
};

module.exports = { createNotification };
