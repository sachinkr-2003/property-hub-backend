const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      default: 'Owner',
    },
    purpose: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    gateway: {
      type: String,
      default: 'Razorpay',
    },
    paymentId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Success', 'Pending', 'Failed', 'Refunded'],
      default: 'Success',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);
