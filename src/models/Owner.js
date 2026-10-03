const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['Direct Owner', 'Broker', 'Commercial Owner'],
      default: 'Direct Owner',
    },
    kycStatus: {
      type: String,
      enum: ['Verified', 'Pending', 'Rejected'],
      default: 'Pending',
    },
    verificationStatus: {
      type: String,
      enum: ['Approved', 'Pending', 'Rejected'],
      default: 'Pending',
    },
    documents: {
      aadhaar: { type: String, default: '' },
      pan: { type: String, default: '' },
      registry: { type: String, default: '' },
      aadhaarUrl: { type: String, default: '' },
      panUrl: { type: String, default: '' },
      registryUrl: { type: String, default: '' },
      selfieUrl: { type: String, default: '' },
    },
    propertiesCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Blocked'],
      default: 'Active',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Owner', ownerSchema);
