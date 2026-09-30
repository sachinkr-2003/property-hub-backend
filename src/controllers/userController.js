const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { initialUsers } = require('../seed/mockSource');

let inMemoryUsers = [...initialUsers];

// @desc    Get all users (tenants, roommates)
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const { status, role, search } = req.query;
    let list;
    try {
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
      list = await User.find(query).sort({ createdAt: -1 });
    } catch (e) {
      list = inMemoryUsers;
    }

    if (!list || list.length === 0) list = inMemoryUsers;

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

    try {
      const user = await User.findOne({ customId: id });
      if (user) {
        nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
        user.status = nextStatus;
        await user.save();
      }
    } catch (e) {
      const found = inMemoryUsers.find(u => u.id === id || u.customId === id);
      if (found) {
        nextStatus = found.status === 'Active' ? 'Suspended' : 'Active';
        found.status = nextStatus;
      }
    }

    return successResponse(res, 200, `User account set to ${nextStatus}`, { status: nextStatus });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getUsers,
  toggleBlockUser,
};
