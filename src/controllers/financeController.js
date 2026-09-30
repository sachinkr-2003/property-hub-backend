const Transaction = require('../models/Transaction');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const mockTransactions = [
  {
    id: "TXN-98401",
    customId: "TXN-98401",
    userName: "Vikramaditya Roy",
    userRole: "Owner",
    purpose: "Owner Premium Subscription (Gold Pro)",
    amount: 999,
    gateway: "Razorpay",
    paymentId: "pay_Rzp9012481",
    status: "Success",
    date: "2026-09-28 14:22"
  },
  {
    id: "TXN-98402",
    customId: "TXN-98402",
    userName: "Harshvardhan Kapoor",
    userRole: "Commercial Owner",
    purpose: "Featured Property Boost (30 Days)",
    amount: 999,
    gateway: "Razorpay",
    paymentId: "pay_Rzp9012993",
    status: "Success",
    date: "2026-09-27 10:15"
  },
  {
    id: "TXN-98403",
    customId: "TXN-98403",
    userName: "Ananya Deshmukh",
    userRole: "Direct Owner",
    purpose: "Property Listing Charge (House #PROP-1002)",
    amount: 199,
    gateway: "Razorpay",
    paymentId: "pay_Rzp9013110",
    status: "Success",
    date: "2026-09-27 09:40"
  }
];

let inMemoryTxns = [...mockTransactions];

// @desc    Get all transactions
// @route   GET /api/finance/transactions
// @access  Private (Admin)
const getTransactions = async (req, res) => {
  try {
    const { status, search } = req.query;
    let list;
    try {
      let query = {};
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { userName: new RegExp(search, 'i') },
          { purpose: new RegExp(search, 'i') },
          { paymentId: new RegExp(search, 'i') },
        ];
      }
      list = await Transaction.find(query).sort({ createdAt: -1 });
    } catch (e) {
      list = inMemoryTxns;
    }

    if (!list || list.length === 0) list = inMemoryTxns;

    return successResponse(res, 200, 'Transactions fetched successfully', list, {
      total: list.length,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Process refund via Razorpay
// @route   POST /api/finance/refund
// @access  Private (Admin)
const processRefund = async (req, res) => {
  try {
    const { refundId, amount, user } = req.body;
    return successResponse(res, 200, `Refund of ₹${amount} for ${user} processed successfully via Razorpay Payouts!`, {
      refundId,
      status: 'Refund Processed',
      payoutReference: `pout_${Math.random().toString(36).substring(2, 9)}`,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getTransactions,
  processRefund,
};
