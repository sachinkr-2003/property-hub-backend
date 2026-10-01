const express = require('express');
const router = express.Router();
const { 
  getTransactions, 
  createRazorpayOrder,
  createTransaction, 
  processRefund, 
  getFinanceSummary 
} = require('../controllers/financeController');

router.get('/transactions', getTransactions);
router.post('/create-order', createRazorpayOrder);
router.post('/transactions', createTransaction);
router.post('/refund', processRefund);
router.get('/summary', getFinanceSummary);

module.exports = router;
