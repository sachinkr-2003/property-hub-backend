const mongoose = require('mongoose');
const Owner = require('../models/Owner');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { initialOwners } = require('../seed/mockSource');

let inMemoryOwners = [...initialOwners];

const getQueryId = (id) => {
  return mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ customId: id }, { _id: id }] }
    : { customId: id };
};

// @desc    Get all owners / landlords
// @route   GET /api/kyc/owners
// @access  Private (Admin)
const getOwners = async (req, res) => {
  try {
    const { status, kycStatus, search } = req.query;
    let list;
    try {
      let query = {};
      if (status) query.status = status;
      if (kycStatus) query.kycStatus = kycStatus;
      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { mobile: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
        ];
      }
      list = await Owner.find(query).sort({ createdAt: -1 });
    } catch (e) {
      list = inMemoryOwners;
    }

    if (!list || list.length === 0) list = inMemoryOwners;

    return successResponse(res, 200, 'Owners list fetched successfully', list, {
      total: list.length,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Approve Owner KYC Dossier
// @route   PATCH /api/kyc/:id/approve
// @access  Private (Admin)
const approveKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    try {
      await Owner.findOneAndUpdate(
        getQueryId(id),
        { kycStatus: 'Verified', verificationStatus: 'Approved', remarks: remarks || 'Verified' },
        { new: true }
      );
    } catch (e) {
      const found = inMemoryOwners.find(o => o.id === id || o.customId === id);
      if (found) {
        found.kycStatus = 'Verified';
        found.verificationStatus = 'Approved';
        found.remarks = remarks;
      }
    }

    return successResponse(res, 200, `Owner KYC for ${id} approved and Verified Trust Badge granted!`);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Reject Owner KYC Dossier
// @route   PATCH /api/kyc/:id/reject
// @access  Private (Admin)
const rejectKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    try {
      await Owner.findOneAndUpdate(
        getQueryId(id),
        { kycStatus: 'Rejected', verificationStatus: 'Rejected', remarks: remarks || 'Rejected' },
        { new: true }
      );
    } catch (e) {
      const found = inMemoryOwners.find(o => o.id === id || o.customId === id);
      if (found) {
        found.kycStatus = 'Rejected';
        found.verificationStatus = 'Rejected';
        found.remarks = remarks;
      }
    }

    return successResponse(res, 200, `Owner KYC application for ${id} rejected.`);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Toggle block/unblock landlord
// @route   PATCH /api/kyc/:id/toggle-block
// @access  Private (Admin)
const toggleBlockOwner = async (req, res) => {
  try {
    const { id } = req.params;
    let nextStatus = 'Blocked';

    try {
      const owner = await Owner.findOne(getQueryId(id));
      if (owner) {
        nextStatus = owner.status === 'Active' ? 'Blocked' : 'Active';
        owner.status = nextStatus;
        await owner.save();
      }
    } catch (e) {
      const found = inMemoryOwners.find(o => o.id === id || o.customId === id);
      if (found) {
        nextStatus = found.status === 'Active' ? 'Blocked' : 'Active';
        found.status = nextStatus;
      }
    }

    return successResponse(res, 200, `Owner status updated to ${nextStatus}`, { status: nextStatus });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getOwners,
  approveKyc,
  rejectKyc,
  toggleBlockOwner,
};
