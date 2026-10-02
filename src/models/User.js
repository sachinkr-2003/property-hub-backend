const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Please provide mobile number'],
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ['Tenant', 'Bachelor', 'Roommate', 'Family', 'Super Admin', 'Staff'],
      default: 'Tenant',
    },
    profileImage: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: 'Lucknow',
    },
    locality: {
      type: String,
      default: 'Gomti Nagar',
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Pending'],
      default: 'Active',
    },
    enquiriesSent: {
      type: Number,
      default: 0,
    },
    reportsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
