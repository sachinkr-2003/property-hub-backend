const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Flat', 'House', 'PG', 'Office', 'Room', 'Plot'],
      default: 'Flat',
    },
    listingType: {
      type: String,
      enum: ['Rent', 'Buy'],
      default: 'Rent',
    },
    price: {
      type: Number,
      required: true,
    },
    priceUnit: {
      type: String,
      default: '/month',
    },
    deposit: {
      type: Number,
    },
    bhk: {
      type: Number,
      default: 2,
    },
    areaSqFt: {
      type: Number,
      default: 1000,
    },
    address: {
      type: String,
      required: true,
    },
    locality: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      default: 'Lucknow',
    },
    images: {
      type: [String],
      default: [],
    },
    deedDocUrl: {
      type: String,
      default: '',
    },
    deedDocName: {
      type: String,
      default: 'Registry / Title Deed Document',
    },
    deedStatus: {
      type: String,
      enum: ['Verified', 'Pending Verification', 'Rejected'],
      default: 'Pending Verification',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    duplicateScore: {
      type: String,
      default: '',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Owner',
    },
    ownerName: {
      type: String,
      required: true,
    },
    ownerPhone: {
      type: String,
      required: true,
    },
    ownerRole: {
      type: String,
      default: 'Direct Owner',
    },
    amenities: {
      type: [String],
      default: ['Power Backup', 'Water Supply', 'Security'],
    },
    furnishing: {
      type: String,
      enum: ['Furnished', 'Semi-Furnished', 'Unfurnished'],
      default: 'Semi-Furnished',
    },
    targetTenant: {
      type: String,
      default: 'Bachelors & Working Singles',
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Pending Verification', 'Rejected', 'Suspended'],
      default: 'Pending Verification',
    },
    reportsCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Property', propertySchema);
