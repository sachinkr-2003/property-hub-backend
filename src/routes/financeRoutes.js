const express = require('express');
const router = express.Router();
const { getTransactions, processRefund } = require('../controllers/financeController');

router.get('/transactions', getTransactions);
router.post('/refund', processRefund);

module.exports = router;
