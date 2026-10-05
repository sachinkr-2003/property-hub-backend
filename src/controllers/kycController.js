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

const Property = require('../models/Property');
const Notification = require('../models/Notification');

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

    try {
      await Notification.create({
        customId: `NTF-${Date.now().toString().slice(-6)}`,
        userId: updated.mobile,
        targetAudience: 'All Users',
        type: 'kyc',
        title: 'KYC Verified Successfully!',
        message: 'Congratulations! Your Landlord KYC has been verified. Verified Trust Badge is now active on your listings.',
        deepLink: 'app://owner/kyc',
        isRead: false,
      });
    } catch (_) {}

    return successResponse(res, 200, `Owner KYC for ${id} approved and Verified Trust Badge granted!`, updated);
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

    try {
      await Notification.create({
        customId: `NTF-${Date.now().toString().slice(-6)}`,
        userId: updated.mobile,
        targetAudience: 'All Users',
        type: 'kyc',
        title: 'KYC Verification Needs Attention',
        message: remarks || 'Your KYC documents were rejected. Please re-upload clear government proof.',
        deepLink: 'app://owner/kyc',
        isRead: false,
      });
    } catch (_) {}

    return successResponse(res, 200, `Owner KYC application for ${id} rejected.`, updated);
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

    // Auto-sync property listings: suspend listings if owner blocked, restore when active
    try {
      await Property.updateMany(
        { ownerPhone: owner.mobile },
        { status: nextStatus === 'Blocked' ? 'Suspended' : 'Active' }
      );
    } catch (_) {}

    return successResponse(res, 200, `Owner status updated to ${nextStatus}`, { status: nextStatus, owner });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Submit or update Owner KYC dossier from mobile app
// @route   POST /api/kyc/submit
// @access  Public / Owner
const submitKyc = async (req, res) => {
  try {
    const {
      name,
      mobile,
      email,
      aadhaarNumber,
      panNumber,
      aadhaarUrl,
      panUrl,
      registryUrl,
      selfieUrl,
      role,
    } = req.body;

    if (!mobile) {
      return errorResponse(res, 400, 'Mobile number is required for KYC registration');
    }

    const cleanMobile = mobile.trim();
    const digitsOnly = cleanMobile.replace(/\D/g, '').slice(-10);
    let owner = await Owner.findOne({
      $or: [
        { mobile: cleanMobile },
        { mobile: new RegExp(digitsOnly + '$') },
      ]
    });

    if (!owner) {
      const count = await Owner.countDocuments();
      const uniqueSuffix = Date.now().toString().slice(-4);
      const customId = `OWN-${500 + count + 1}-${uniqueSuffix}`;
      owner = new Owner({
        customId,
        name: name?.trim() || 'Landlord',
        mobile: cleanMobile,
        email: email?.trim() || `${cleanMobile.replace(/[^0-9]/g, '')}@propertyhub.in`,
        role: role || 'Direct Owner',
      });
    } else {
      if (name) owner.name = name.trim();
      if (email) owner.email = email.trim();
      if (role) owner.role = role;
    }

    owner.kycStatus = 'Pending';
    owner.verificationStatus = 'Pending';
    owner.remarks = 'KYC documents under review by admin';

    owner.documents = {
      aadhaar: aadhaarNumber || owner.documents?.aadhaar || '',
      pan: panNumber || owner.documents?.pan || '',
      registry: registryUrl ? 'Title Deed Submitted' : (owner.documents?.registry || ''),
      aadhaarUrl: aadhaarUrl || owner.documents?.aadhaarUrl || '',
      panUrl: panUrl || owner.documents?.panUrl || '',
      registryUrl: registryUrl || owner.documents?.registryUrl || '',
      selfieUrl: selfieUrl || owner.documents?.selfieUrl || '',
    };

    await owner.save();

    return successResponse(res, 201, 'KYC submitted successfully. Awaiting admin approval.', owner);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get owner's KYC status by mobile number
// @route   GET /api/kyc/status/:mobile
// @access  Public / Owner
const getKycStatus = async (req, res) => {
  try {
    const { mobile } = req.params;
    const cleanMobile = mobile.trim();
    const digitsOnly = cleanMobile.replace(/\D/g, '').slice(-10);

    const owner = await Owner.findOne({
      $or: [
        { mobile: cleanMobile },
        { mobile: new RegExp(digitsOnly + '$') },
      ]
    });
    if (!owner) {
      return successResponse(res, 200, 'Owner KYC profile not found', {
        kycStatus: 'Unverified',
        verificationStatus: 'Pending',
        documents: {},
      });
    }

    return successResponse(res, 200, 'KYC status retrieved successfully', {
      id: owner.customId,
      name: owner.name,
      mobile: owner.mobile,
      kycStatus: owner.kycStatus,
      verificationStatus: owner.verificationStatus,
      documents: owner.documents,
      remarks: owner.remarks,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getOwners,
  approveKyc,
  rejectKyc,
  toggleBlockOwner,
  submitKyc,
  getKycStatus,
};
