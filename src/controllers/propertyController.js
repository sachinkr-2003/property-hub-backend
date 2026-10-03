const mongoose = require('mongoose');
const Property = require('../models/Property');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getQueryId = (id) => {
  return mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ customId: id }, { _id: id }] }
    : { customId: id };
};

// @desc    Get all properties with filters
// @route   GET /api/properties
// @access  Public
const getProperties = async (req, res) => {
  try {
    const { status, type, locality, minPrice, maxPrice, search } = req.query;

    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (locality) query.locality = new RegExp(locality, 'i');
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { locality: new RegExp(search, 'i') },
        { ownerName: new RegExp(search, 'i') },
      ];
    }
    const items = await Property.find(query).sort({ createdAt: -1 });

    return successResponse(res, 200, 'Properties fetched successfully', items, {
      total: items.length,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get single property by ID
// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const prop = await Property.findOne(getQueryId(id));

    if (!prop) {
      return errorResponse(res, 404, 'Property listing not found');
    }

    return successResponse(res, 200, 'Property retrieved successfully', prop);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create new property listing
// @route   POST /api/properties
// @access  Private
const createProperty = async (req, res) => {
  try {
    const body = req.body;
    const count = await Property.countDocuments();
    const uniqueSuffix = Date.now().toString().slice(-4);
    const customId = body.customId && body.customId.startsWith('PROP-') 
      ? body.customId 
      : `PROP-${1000 + count + 1}-${uniqueSuffix}`;

    const newProp = {
      ...body,
      id: customId,
      customId,
      title: body.title || 'Verified Property Listing',
      type: body.type || 'Flat',
      listingType: body.listingType || 'Rent',
      price: Number(body.price) || 15000,
      address: body.address || body.locality || 'Lucknow, UP',
      locality: body.locality || 'Gomti Nagar',
      city: body.city || 'Lucknow',
      ownerName: body.ownerName || 'Property Owner',
      ownerPhone: body.ownerPhone || '+91 91353 21898',
      status: 'Pending Verification',
      isVerified: false,
      deedDocUrl: body.deedDocUrl || '',
      deedDocName: body.deedDocName || 'Registry / Title Deed Document',
      deedStatus: 'Pending Verification',
      postedAt: new Date().toISOString().split('T')[0],
    };

    const created = await Property.create(newProp);

    return successResponse(res, 201, 'Property listing created successfully', created);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update property approval status (Active, Rejected)
// @route   PATCH /api/properties/:id/status
// @access  Private (Admin)
const updatePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deedStatus, isVerified } = req.body;

    if (status && !['Active', 'Pending Verification', 'Rejected', 'Suspended', 'Paused'].includes(status)) {
      return errorResponse(res, 400, 'Invalid property status');
    }

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'Active') {
        updateData.isVerified = true;
        updateData.deedStatus = 'Verified';
      } else if (status === 'Rejected') {
        updateData.isVerified = false;
        updateData.deedStatus = 'Rejected';
      }
    }

    if (isVerified !== undefined) {
      updateData.isVerified = Boolean(isVerified);
      if (isVerified === true) {
        updateData.deedStatus = 'Verified';
      }
    }

    if (deedStatus) {
      updateData.deedStatus = deedStatus;
      if (deedStatus === 'Verified') {
        updateData.isVerified = true;
      }
    }

    const updatedProp = await Property.findOneAndUpdate(getQueryId(id), updateData, { new: true });
    
    if (!updatedProp) {
      return errorResponse(res, 404, 'Property listing not found');
    }

    return successResponse(res, 200, `Property listing status updated successfully`, updatedProp);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update full property details
// @route   PUT /api/properties/:id or PATCH /api/properties/:id
// @access  Public / Private
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updated = await Property.findOneAndUpdate(
      getQueryId(id),
      { $set: body },
      { new: true, runValidators: false }
    );

    if (!updated) {
      return errorResponse(res, 404, 'Property listing not found');
    }

    return successResponse(res, 200, 'Property updated successfully', updated);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Toggle property featured boost
// @route   PATCH /api/properties/:id/featured
// @access  Private (Admin)
const togglePropertyFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    let nextState = true;

    const prop = await Property.findOne(getQueryId(id));
    if (!prop) {
      return errorResponse(res, 404, 'Property listing not found');
    }
    
    nextState = !prop.isFeatured;
    prop.isFeatured = nextState;
    await prop.save();

    return successResponse(res, 200, `Property featured status set to ${nextState}`, { isFeatured: nextState });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Delete property listing
// @route   DELETE /api/properties/:id
// @access  Private (Admin)
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Property.findOneAndDelete(getQueryId(id));
    if (!deleted) {
      return errorResponse(res, 404, 'Property listing not found');
    }
    return successResponse(res, 200, 'Property listing permanently deleted', { id });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  updatePropertyStatus,
  togglePropertyFeatured,
  deleteProperty,
};
