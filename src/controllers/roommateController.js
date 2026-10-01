const mongoose = require('mongoose');
const Roommate = require('../models/Roommate');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all roommate / flatmate profiles
// @route   GET /api/roommates
// @access  Public / Admin
const getRoommates = async (req, res) => {
  try {
    const { gender, status, search, locality } = req.query;
    const query = {};

    if (gender && gender !== 'All') {
      query.gender = gender;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (locality && locality !== 'All') {
      query.targetLocality = { $regex: locality, $options: 'i' };
    }
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { targetLocality: { $regex: search, $options: 'i' } },
        { profession: { $regex: search, $options: 'i' } },
        { lookingFor: { $regex: search, $options: 'i' } },
        { customId: { $regex: search, $options: 'i' } },
      ];
    }

    const roommates = await Roommate.find(query).sort({ createdAt: -1 });

    return successResponse(res, 200, 'Roommate requests fetched successfully from MongoDB', roommates, {
      total: roommates.length,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Post a new roommate requirement
// @route   POST /api/roommates
// @access  Public / Tenant
const createRoommate = async (req, res) => {
  try {
    const {
      userName,
      userAvatar,
      phone,
      email,
      gender,
      lookingFor,
      budget,
      targetLocality,
      city,
      profession,
      bio,
      tags,
    } = req.body;

    if (!userName || !phone || !budget || !targetLocality) {
      return errorResponse(res, 400, 'Please provide userName, phone, budget, and targetLocality');
    }

    const count = await Roommate.countDocuments();
    const customId = `RM-${String(count + 101)}`;

    const newRoommate = await Roommate.create({
      customId,
      userName,
      userAvatar: userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      phone,
      email: email || '',
      gender: gender || 'Male',
      lookingFor: lookingFor || 'Male Flatmate',
      budget: Number(budget),
      targetLocality,
      city: city || 'Lucknow',
      profession: profession || 'Working Professional',
      bio: bio || '',
      tags: Array.isArray(tags) ? tags : ['Non-Smoker', 'Quiet Space'],
      status: 'Active',
    });

    return successResponse(res, 201, 'Roommate requirement posted successfully in MongoDB', newRoommate);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update roommate listing status (Active, Suspended, Found Match)
// @route   PATCH /api/roommates/:id/status
// @access  Private (Admin / User)
const updateRoommateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return errorResponse(res, 400, 'Please provide status');
    }

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const roommate = await Roommate.findOne(query);
    if (!roommate) {
      return errorResponse(res, 404, 'Roommate profile not found');
    }

    roommate.status = status;
    await roommate.save();

    return successResponse(res, 200, `Roommate ${id} status updated to ${status}`, roommate);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Delete roommate profile
// @route   DELETE /api/roommates/:id
// @access  Private (Admin)
const deleteRoommate = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const roommate = await Roommate.findOneAndDelete(query);
    if (!roommate) {
      return errorResponse(res, 404, 'Roommate profile not found');
    }

    return successResponse(res, 200, `Roommate profile ${id} removed successfully from MongoDB`);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getRoommates,
  createRoommate,
  updateRoommateStatus,
  deleteRoommate,
};
