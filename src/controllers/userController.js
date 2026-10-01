const mongoose = require('mongoose');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getQueryId = (id) => {
  return mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ customId: id }, { _id: id }] }
    : { customId: id };
};

// @desc    Get all users (tenants, roommates)
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const { status, role, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (role) query.role = new RegExp(role, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { mobile: new RegExp(search, 'i') },
      ];
    }
    const list = await User.find(query).sort({ createdAt: -1 });

    return successResponse(res, 200, 'Users fetched successfully', list, {
      total: list.length,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Toggle block / suspend user account
// @route   PATCH /api/users/:id/toggle-block
// @access  Private (Admin)
const toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    let nextStatus = 'Suspended';

    const user = await User.findOne(getQueryId(id));
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    
    nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    user.status = nextStatus;
    await user.save();

    return successResponse(res, 200, `User account set to ${nextStatus}`, { status: nextStatus });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getUsers,
  toggleBlockUser,
};
