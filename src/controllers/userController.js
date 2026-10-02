const mongoose = require('mongoose');
const User = require('../models/User');
const Visit = require('../models/Visit');
const Roommate = require('../models/Roommate');
const UsedItem = require('../models/UsedItem');
const Ticket = require('../models/Ticket');
const { initialUsers } = require('../seed/mockSource');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getQueryId = (id) => {
  return mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ customId: id }, { _id: id }] }
    : { customId: id };
};

// @desc    Get all users (tenants, roommates) with auto-seed fallback
// @route   GET /api/users
// @access  Public / Private (Admin)
const getUsers = async (req, res) => {
  try {
    // Auto-seed if collection is empty
    const count = await User.countDocuments();
    if (count === 0 && initialUsers && initialUsers.length > 0) {
      await User.insertMany(initialUsers);
      console.log(`[UserController] Auto-seeded ${initialUsers.length} initial users into MongoDB`);
    }

    const { status, role, search } = req.query;
    let query = {};
    if (status && status !== 'All') query.status = status;
    if (role && role !== 'All') query.role = new RegExp(role, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { mobile: new RegExp(search, 'i') },
        { customId: new RegExp(search, 'i') },
        { locality: new RegExp(search, 'i') },
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

// @desc    Get complete 360-degree user profile and activities
// @route   GET /api/users/:id
// @access  Private (Admin)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne(getQueryId(id));
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Aggregate linked activities
    const [visits, roommates, usedItems, tickets] = await Promise.all([
      Visit.find({
        $or: [
          { userId: user._id },
          { userId: user.customId },
          { userPhone: user.mobile },
          { visitorPhone: user.mobile },
        ],
      }).sort({ createdAt: -1 }).limit(10).catch(() => []),
      Roommate.find({
        $or: [
          { phone: user.mobile },
          { email: user.email },
        ],
      }).sort({ createdAt: -1 }).limit(10).catch(() => []),
      UsedItem.find({
        $or: [
          { phone: user.mobile },
          { sellerPhone: user.mobile },
        ],
      }).sort({ createdAt: -1 }).limit(10).catch(() => []),
      Ticket.find({
        $or: [
          { userEmail: user.email },
          { phone: user.mobile },
        ],
      }).sort({ createdAt: -1 }).limit(10).catch(() => []),
    ]);

    const fullDossier = {
      ...user.toObject(),
      activities: {
        visits,
        roommates,
        usedItems,
        tickets,
      },
      stats: {
        totalVisits: visits.length,
        totalRoommatePosts: roommates.length,
        totalUsedItems: usedItems.length,
        totalTickets: tickets.length,
      },
    };

    return successResponse(res, 200, 'User details dossier fetched successfully', fullDossier);
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

    return successResponse(res, 200, `User account set to ${nextStatus}`, { status: nextStatus, user });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update user profile data from Admin
// @route   PATCH /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedUpdates = [
      'name', 'email', 'mobile', 'role', 'status',
      'city', 'locality', 'profileImage', 'enquiriesSent', 'reportsCount',
    ];

    const updateData = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    const user = await User.findOneAndUpdate(
      getQueryId(id),
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'User updated successfully', user);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndDelete(getQueryId(id));
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'User deleted successfully', { id });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getUsers,
  getUserById,
  toggleBlockUser,
  updateUser,
  deleteUser,
};
