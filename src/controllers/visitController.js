const mongoose = require('mongoose');
const Visit = require('../models/Visit');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all property visits & leads
// @route   GET /api/visits
// @access  Private (Admin / Owner / Tenant)
const getVisits = async (req, res) => {
  try {
    const { status, leadType, search } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }
    if (leadType && leadType !== 'All') {
      query.leadType = leadType;
    }
    if (search) {
      query.$or = [
        { visitorName: { $regex: search, $options: 'i' } },
        { propertyTitle: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { visitorPhone: { $regex: search, $options: 'i' } },
        { locality: { $regex: search, $options: 'i' } },
        { customId: { $regex: search, $options: 'i' } },
      ];
    }

    const visits = await Visit.find(query).sort({ createdAt: -1 });

    return successResponse(res, 200, 'Property visits fetched successfully from MongoDB', visits, {
      total: visits.length,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Book a new site visit
// @route   POST /api/visits
// @access  Public / Tenant
const createVisit = async (req, res) => {
  try {
    const {
      propertyId,
      propertyTitle,
      locality,
      city,
      visitorName,
      visitorPhone,
      visitorEmail,
      ownerName,
      ownerPhone,
      slotDate,
      slotTime,
      leadType,
      notes,
    } = req.body;

    if (!propertyTitle || !visitorName || !visitorPhone || !slotDate) {
      return errorResponse(res, 400, 'Please provide propertyTitle, visitorName, visitorPhone, and slotDate');
    }

    const count = await Visit.countDocuments();
    const customId = `VIS-${String(count + 401)}`;
    const passCode = `PH-VIS-${Math.floor(1000 + Math.random() * 9000)}`;

    const newVisit = await Visit.create({
      customId,
      propertyId: propertyId || '',
      propertyTitle,
      locality: locality || 'Lucknow',
      city: city || 'Lucknow',
      visitorName,
      visitorPhone,
      visitorEmail: visitorEmail || '',
      ownerName: ownerName || 'Direct Property Landlord',
      ownerPhone: ownerPhone || '',
      slotDate,
      slotTime: slotTime || 'Morning (10:00 AM - 1:00 PM)',
      leadType: leadType || 'Direct Bachelor',
      status: 'Confirmed',
      passCode,
      notes: notes || '',
    });

    return successResponse(res, 201, 'Site visit slot booked successfully in MongoDB', newVisit);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update visit status (Completed, Cancelled, Confirmed)
// @route   PATCH /api/visits/:id/status
// @access  Private (Admin / Landlord)
const updateVisitStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return errorResponse(res, 400, 'Please provide status');
    }

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const visit = await Visit.findOne(query);
    if (!visit) {
      return errorResponse(res, 404, 'Visit booking not found');
    }

    visit.status = status;
    await visit.save();

    return successResponse(res, 200, `Visit ${id} status updated to ${status}`, visit);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Delete / Cancel visit booking
// @route   DELETE /api/visits/:id
// @access  Private (Admin)
const deleteVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const visit = await Visit.findOneAndDelete(query);
    if (!visit) {
      return errorResponse(res, 404, 'Visit booking not found');
    }

    return successResponse(res, 200, `Visit booking ${id} removed successfully from MongoDB`);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getVisits,
  createVisit,
  updateVisitStatus,
  deleteVisit,
};
