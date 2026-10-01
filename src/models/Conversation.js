const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  customId: { type: String },
  senderId: { type: String, default: 'user' },
  senderName: { type: String, default: 'User' },
  text: { type: String, required: true },
  isSender: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema(
  {
    customId: { type: String, unique: true },
    participantName: { type: String, required: true },
    participantRole: { type: String, default: 'Direct Owner' },
    avatarUrl: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    },
    propertyTitle: { type: String, default: '' },
    lastMessage: { type: String, default: '' },
    lastMessageTime: { type: Date, default: Date.now },
    unreadCount: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: true },
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
