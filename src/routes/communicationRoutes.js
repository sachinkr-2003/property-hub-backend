const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/communicationController');

router.post('/broadcast-push', broadcastPushNotification);
router.get('/tickets', getTickets);
router.post('/tickets', createTicket);
router.patch('/tickets/:id/resolve', resolveTicket);
router.patch('/tickets/:id/status', updateTicketStatus);

// Notification endpoints for Mobile & Web
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.delete('/notifications', clearNotifications);

// Real-Time Chat & Inquiry endpoints
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.post('/conversations/:id/messages', sendMessage);

module.exports = router;
