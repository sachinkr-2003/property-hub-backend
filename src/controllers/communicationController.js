const Ticket = require('../models/Ticket');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const mockTickets = [
  {
    id: "TCK-501",
    customId: "TCK-501",
    from: "Deepak Srivastava (Tenant)",
    phone: "+91 99190 44332",
    subject: "Owner not answering scheduled visit call",
    category: "Visit Enquiry",
    priority: "High",
    status: "Open",
    createdAt: "2026-09-30 14:10"
  },
  {
    id: "TCK-502",
    customId: "TCK-502",
    from: "Tanmay Gupta (Seller)",
    phone: "+91 98190 77123",
    subject: "Buyer asking for delivery without payment",
    category: "Used Marketplace",
    priority: "Medium",
    status: "In Progress",
    createdAt: "2026-09-29 18:30"
  }
];

let inMemoryTickets = [...mockTickets];

// @desc    Broadcast Firebase Push Notification to Mobile Users
// @route   POST /api/communication/broadcast-push
// @access  Private (Admin)
const broadcastPushNotification = async (req, res) => {
  try {
    const { title, message, targetAudience, deepLink } = req.body;

    if (!title || !message) {
      return errorResponse(res, 400, 'Title and message body are required for push broadcast');
    }

    // FCM dispatch simulation
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

    return successResponse(res, 200, `Push notification broadcasted to ${broadcastResult.targetAudience}!`, broadcastResult);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get support tickets
// @route   GET /api/communication/tickets
// @access  Private (Admin)
const getTickets = async (req, res) => {
  try {
    return successResponse(res, 200, 'Tickets retrieved successfully', inMemoryTickets);
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
    const found = inMemoryTickets.find(t => t.id === id || t.customId === id);
    if (found) {
      found.status = 'Resolved';
      return successResponse(res, 200, `Support ticket ${id} marked as resolved!`);
    }
    return errorResponse(res, 404, 'Ticket not found');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  broadcastPushNotification,
  getTickets,
  resolveTicket,
};
