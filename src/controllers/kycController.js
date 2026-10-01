const mongoose = require('mongoose');
const Owner = require('../models/Owner');
const { successResponse, errorResponse } = require('../utils/apiResponse');

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
    const list = await Owner.find(query).sort({ createdAt: -1 });

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

    const updated = await Owner.findOneAndUpdate(
      getQueryId(id),
      { kycStatus: 'Verified', verificationStatus: 'Approved', remarks: remarks || 'Verified' },
      { new: true }
    );
    if (!updated) {
      return errorResponse(res, 404, 'Owner not found');
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

    const updated = await Owner.findOneAndUpdate(
      getQueryId(id),
      { kycStatus: 'Rejected', verificationStatus: 'Rejected', remarks: remarks || 'Rejected' },
      { new: true }
    );
    if (!updated) {
      return errorResponse(res, 404, 'Owner not found');
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

    const owner = await Owner.findOne(getQueryId(id));
    if (!owner) {
      return errorResponse(res, 404, 'Owner not found');
    }
    
    nextStatus = owner.status === 'Active' ? 'Blocked' : 'Active';
    owner.status = nextStatus;
    await owner.save();

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
