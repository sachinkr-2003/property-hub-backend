const mongoose = require('mongoose');

const usedItemSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Furniture', 'Appliances', 'Electronics', 'Vehicles', 'Books / Other'],
      default: 'Furniture',
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
    },
    sellerName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    locality: {
      type: String,
      default: 'Lucknow',
    },
    status: {
      type: String,
      enum: ['Active', 'Sold', 'Reported', 'Removed'],
      default: 'Active',
    },
    condition: {
      type: String,
      default: 'Good (Used)',
    },
    reported: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('UsedItem', usedItemSchema);
