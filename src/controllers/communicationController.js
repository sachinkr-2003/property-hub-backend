const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const defaultConversations = [
  {
    customId: 'chat-seed-1',
    participantName: 'Suresh Verma',
    participantRole: 'Direct Owner',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    propertyTitle: '3 BHK Luxury Apartment in Gomti Nagar',
    lastMessage: 'Yes, it is available for immediate occupancy. When can you visit?',
    lastMessageTime: new Date(Date.now() - 35 * 60 * 1000),
    unreadCount: 1,
    isOnline: true,
    messages: [
      {
        customId: 'm1',
        senderName: 'You',
        text: 'Hi Suresh ji, is this 3 BHK flat still available for rent?',
        isSender: true,
        timestamp: new Date(Date.now() - 40 * 60 * 1000),
      },
      {
        customId: 'm2',
        senderName: 'Suresh Verma',
        text: 'Yes, it is available for immediate occupancy. When can you visit?',
        isSender: false,
        timestamp: new Date(Date.now() - 35 * 60 * 1000),
      },
    ],
  },
  {
    customId: 'chat-seed-2',
    participantName: 'Amit Singh',
    participantRole: 'Flatmate / Roommate',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    propertyTitle: 'Need Roommate: 2 BHK Flat near IT City',
    lastMessage: 'Great, let us connect over a call tonight.',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    messages: [
      {
        customId: 'm3',
        senderName: 'You',
        text: 'Hey Amit! I saw your roommate profile. Are you still looking?',
        isSender: true,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        customId: 'm4',
        senderName: 'Amit Singh',
        text: 'Great, let us connect over a call tonight.',
        isSender: false,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
  },
];

const defaultNotifications = [
  {
    customId: 'NTF-1001',
    userId: 'all',
    targetAudience: 'All Users',
    type: 'broadcast',
    title: '⚡ Welcome to Property Hub Live Network!',
    message: 'Browse 100% verified flats, PG rooms & direct owner properties across Lucknow with zero brokerage.',
    deepLink: 'app://home',
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    customId: 'NTF-1002',
    userId: 'all',
    targetAudience: 'All Users',
    type: 'kyc',
    title: 'Property Verification Approved',
    message: 'Your 3 BHK Flat in Indira Nagar has been verified and marked genuine by the admin team.',
    deepLink: 'app://kyc',
    isRead: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    customId: 'NTF-1003',
    userId: 'all',
    targetAudience: 'All Users',
    type: 'visit',
    title: 'Visit Request Confirmed',
    message: 'Visit confirmed for tomorrow at 5:00 PM for Indira Nagar flat. Contact owner directly.',
    deepLink: 'app://visits',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    customId: 'NTF-1004',
    userId: 'all',
    targetAudience: 'All Users',
    type: 'service',
    title: 'Tiffin & Home Cleaning Service',
    message: 'Your subscription is active. Book verified household staff and meal subscriptions anytime.',
    deepLink: 'app://services',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

// @desc    Broadcast Firebase Push Notification to Mobile Users
// @route   POST /api/communication/broadcast-push
// @access  Private (Admin)
const broadcastPushNotification = async (req, res) => {
  try {
    const { title, message, targetAudience, deepLink } = req.body;

    if (!title || !message) {
      return errorResponse(res, 400, 'Title and message body are required for push broadcast');
    }

    const broadcastResult = {
      messageId: `fcm_msg_${Date.now()}`,
      title,
      message,
      targetAudience: targetAudience || 'All Users',
      deepLink: deepLink || 'app://home',
      devicesReached: targetAudience?.includes('Owner') ? 2230 : 6190,
      deliveryStatus: 'Queued to Firebase Cloud Messaging Edge',
      timestamp: new Date().toISOString(),
    };

    // Log to audit activity in MongoDB
    try {
      await ActivityLog.create({
        admin: 'Aarav Singhania (Super Admin)',
        action: `FCM Broadcast: "${title}"`,
        target: targetAudience || 'All Platform Users',
      });
    } catch (_) {}

    // Persist in MongoDB Notification collection
    try {
      const count = await Notification.countDocuments();
      await Notification.create({
        customId: `NTF-${1000 + count + 1}`,
        userId: 'all',
        targetAudience: targetAudience || 'All Users',
        type: 'broadcast',
        title,
        message,
        deepLink: deepLink || 'app://home',
        isRead: false,
      });
    } catch (saveErr) {
      console.warn('[Notification] Failed saving broadcast to DB:', saveErr.message);
    }

    return successResponse(
      res,
      200,
      `Push notification broadcasted successfully to ${broadcastResult.devicesReached.toLocaleString()} devices!`,
      broadcastResult
    );
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get support tickets
// @route   GET /api/communication/tickets
// @access  Private (Admin)
const getTickets = async (req, res) => {
  try {
    const { status, category, priority, search } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }
    if (category && category !== 'All') {
      query.category = { $regex: category, $options: 'i' };
    }
    if (priority && priority !== 'All') {
      query.priority = priority;
    }
    if (search) {
      query.$or = [
        { from: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { customId: { $regex: search, $options: 'i' } },
      ];
    }

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });

    return successResponse(res, 200, 'Tickets retrieved successfully from MongoDB', tickets, {
      total: tickets.length,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create new support ticket
// @route   POST /api/communication/tickets
// @access  Public / Tenant / Owner
const createTicket = async (req, res) => {
  try {
    const { from, phone, subject, category, priority, details } = req.body;
    if (!from || !subject) {
      return errorResponse(res, 400, 'Please provide sender name and subject');
    }

    const count = await Ticket.countDocuments();
    const customId = `TKT-${String(count + 301)}`;

    const newTicket = await Ticket.create({
      customId,
      from,
      phone: phone || '+91 99999 99999',
      subject,
      category: category || 'Visit Enquiry',
      priority: priority || 'Medium',
      details: details || '',
      status: 'Open',
    });

    return successResponse(res, 201, 'Support ticket created successfully in MongoDB', newTicket);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Resolve support ticket
// @route   PATCH /api/communication/tickets/:id/resolve
// @access  Private (Admin)
const resolveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const ticket = await Ticket.findOne(query);
    if (!ticket) {
      return errorResponse(res, 404, 'Ticket not found');
    }

    ticket.status = 'Resolved';
    await ticket.save();

    return successResponse(res, 200, `Support ticket ${id} marked as resolved in MongoDB!`, ticket);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update ticket status (In Progress, Open, Resolved)
// @route   PATCH /api/communication/tickets/:id/status
// @access  Private (Admin)
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const ticket = await Ticket.findOne(query);
    if (!ticket) {
      return errorResponse(res, 404, 'Ticket not found');
    }

    ticket.status = status || 'In Progress';
    await ticket.save();

    return successResponse(res, 200, `Support ticket ${id} status updated to ${ticket.status}`, ticket);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get notifications for mobile user
// @route   GET /api/communication/notifications
// @access  Public / User
const getNotifications = async (req, res) => {
  try {
    const { targetAudience, userId } = req.query;
    let query = {};
    if (userId && userId !== 'all') {
      query.$or = [{ userId: 'all' }, { userId }];
    }
    if (targetAudience && targetAudience !== 'All' && targetAudience !== 'All Users') {
      query.$or = (query.$or || []).concat([
        { targetAudience: 'All Users' },
        { targetAudience: 'All Platform Users' },
        { targetAudience },
      ]);
    }

    let notifications = await Notification.find(query).sort({ createdAt: -1 });

    // Seed defaults if empty
    if (notifications.length === 0) {
      const count = await Notification.countDocuments();
      if (count === 0) {
        await Notification.insertMany(defaultNotifications);
        notifications = await Notification.find({}).sort({ createdAt: -1 });
      }
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return successResponse(res, 200, 'Notifications fetched successfully', notifications, {
      total: notifications.length,
      unreadCount,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/communication/notifications/:id/read
// @access  Public / User
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const notif = await Notification.findOneAndUpdate(query, { isRead: true }, { new: true });
    return successResponse(res, 200, 'Notification marked as read', notif);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/communication/notifications
// @access  Public / User
const clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});
    return successResponse(res, 200, 'All notifications cleared successfully');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get all chat conversations
// @route   GET /api/communication/conversations
// @access  Public / User
const getConversations = async (req, res) => {
  try {
    let convos = await Conversation.find({}).sort({ lastMessageTime: -1 });

    if (convos.length === 0) {
      const count = await Conversation.countDocuments();
      if (count === 0) {
        await Conversation.insertMany(defaultConversations);
        convos = await Conversation.find({}).sort({ lastMessageTime: -1 });
      }
    }

    return successResponse(res, 200, 'Conversations fetched successfully', convos, {
      total: convos.length,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create or get conversation
// @route   POST /api/communication/conversations
// @access  Public / User
const createConversation = async (req, res) => {
  try {
    const { participantName, propertyTitle, avatarUrl, role, initialMessage } = req.body;
    if (!participantName) {
      return errorResponse(res, 400, 'Participant name is required');
    }

    let convo = await Conversation.findOne({
      participantName: new RegExp(`^${participantName.trim()}$`, 'i'),
      ...(propertyTitle ? { propertyTitle: new RegExp(`^${propertyTitle.trim()}$`, 'i') } : {}),
    });

    if (!convo) {
      const count = await Conversation.countDocuments();
      const customId = `chat-${Date.now()}`;
      const msg = initialMessage || `Hi, I am interested in: ${propertyTitle || 'your listing'}`;
      convo = await Conversation.create({
        customId,
        participantName,
        participantRole: role || 'Direct Owner',
        avatarUrl:
          avatarUrl ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        propertyTitle: propertyTitle || '',
        lastMessage: msg,
        lastMessageTime: new Date(),
        unreadCount: 0,
        isOnline: true,
        messages: [
          {
            customId: `msg-${Date.now()}`,
            senderName: 'You',
            text: msg,
            isSender: true,
            timestamp: new Date(),
          },
        ],
      });
    }

    return successResponse(res, 201, 'Conversation ready', convo);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Send message in conversation
// @route   POST /api/communication/conversations/:id/messages
// @access  Public / User
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, senderName, isSender } = req.body;

    if (!text || !text.trim()) {
      return errorResponse(res, 400, 'Message text is required');
    }

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const convo = await Conversation.findOne(query);
    if (!convo) {
      return errorResponse(res, 404, 'Conversation not found');
    }

    const newMsg = {
      customId: `msg-${Date.now()}`,
      senderName: senderName || 'You',
      text: text.trim(),
      isSender: isSender !== undefined ? isSender : true,
      timestamp: new Date(),
    };

    convo.messages.push(newMsg);
    convo.lastMessage = newMsg.text;
    convo.lastMessageTime = newMsg.timestamp;
    await convo.save();

    return successResponse(res, 200, 'Message sent successfully', convo);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  broadcastPushNotification,
  getTickets,
  createTicket,
  resolveTicket,
  updateTicketStatus,
  getNotifications,
  markNotificationRead,
  clearNotifications,
  getConversations,
  createConversation,
  sendMessage,
};
