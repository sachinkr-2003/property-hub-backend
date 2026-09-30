const express = require('express');
const router = express.Router();
const {
  broadcastPushNotification,
  getTickets,
  resolveTicket,
} = require('../controllers/communicationController');

router.post('/broadcast-push', broadcastPushNotification);
router.get('/tickets', getTickets);
router.patch('/tickets/:id/resolve', resolveTicket);

module.exports = router;
