const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      required: true,
    },
    propertyId: {
      type: String,
      default: '',
    },
    propertyTitle: {
      type: String,
      required: true,
    },
    locality: {
      type: String,
      default: 'Lucknow',
    },
    city: {
      type: String,
      default: 'Lucknow',
    },
    visitorName: {
      type: String,
      required: true,
    },
    visitorPhone: {
      type: String,
      required: true,
    },
    visitorEmail: {
      type: String,
      default: '',
    },
    ownerName: {
      type: String,
      required: true,
    },
    ownerPhone: {
      type: String,
      default: '',
    },
    slotDate: {
      type: String,
      required: true,
    },
    slotTime: {
      type: String,
      default: 'Morning (10:00 AM - 1:00 PM)',
    },
    leadType: {
      type: String,
      enum: ['Direct Bachelor', 'Family / Couple', 'Corporate Tenant', 'Buyer / Investor'],
      default: 'Direct Bachelor',
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Confirmed',
    },
    passCode: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Visit', visitSchema);
