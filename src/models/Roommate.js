const mongoose = require('mongoose');

const roommateSchema = new mongoose.Schema(
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
    userAvatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Any'],
      default: 'Male',
    },
    lookingFor: {
      type: String,
      default: 'Male Flatmate',
    },
    budget: {
      type: Number,
      required: true,
    },
    targetLocality: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      default: 'Lucknow',
    },
    profession: {
      type: String,
      default: 'Working Professional',
    },
    bio: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: ['Non-Smoker', 'Quiet Space'],
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Found Match'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Roommate', roommateSchema);
