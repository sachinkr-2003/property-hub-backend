const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
    },
    userId: {
      type: String,
      default: 'all',
      index: true,
    },
    targetAudience: {
      type: String,
      default: 'All Users',
    },
    type: {
      type: String,
      enum: ['broadcast', 'kyc', 'visit', 'chat', 'service', 'lead', 'general'],
      default: 'general',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    deepLink: {
      type: String,
      default: 'app://home',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
