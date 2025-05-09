const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chore'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['reminder', 'completion', 'verification', 'system'],
    default: 'reminder'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  deliveryMethod: {
    type: String,
    enum: ['app', 'email', 'both'],
    default: 'both'
  },
  scheduledFor: {
    type: Date
  },
  sentAt: {
    type: Date
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;