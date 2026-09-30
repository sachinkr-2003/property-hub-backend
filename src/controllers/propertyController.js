const Property = require('../models/Property');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { initialProperties } = require('../seed/mockSource');

let inMemoryProperties = [...initialProperties];

// @desc    Get all properties with filters
// @route   GET /api/properties
// @access  Public
const getProperties = async (req, res) => {
  try {
    const { status, type, locality, minPrice, maxPrice, search } = req.query;

    let items;
    try {
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
      items = await Property.find(query).sort({ createdAt: -1 });
    } catch (e) {
      // Fallback to in-memory
      items = inMemoryProperties;
    }

    if (!items || items.length === 0) {
      items = inMemoryProperties;
    }

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
    let prop;
    try {
      prop = await Property.findOne({ customId: id });
    } catch (e) {
      prop = inMemoryProperties.find(p => p.id === id || p.customId === id);
    }

    if (!prop) {
      prop = inMemoryProperties.find(p => p.id === id || p.customId === id);
    }

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
    const customId = `PROP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProp = {
      ...body,
      id: customId,
      customId,
      status: body.status || 'Pending Verification',
      postedAt: new Date().toISOString().split('T')[0],
    };

    try {
      await Property.create(newProp);
    } catch (e) {
      inMemoryProperties.unshift(newProp);
    }

    return successResponse(res, 201, 'Property listing created successfully', newProp);
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
    const { status } = req.body;

    if (!['Active', 'Pending Verification', 'Rejected', 'Suspended'].includes(status)) {
      return errorResponse(res, 400, 'Invalid property status');
    }

    try {
      await Property.findOneAndUpdate({ customId: id }, { status });
    } catch (e) {
      // In-memory fallback
      const found = inMemoryProperties.find(p => p.id === id || p.customId === id);
      if (found) found.status = status;
    }

    return successResponse(res, 200, `Property listing status updated to ${status}`);
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

    try {
      const prop = await Property.findOne({ customId: id });
      if (prop) {
        nextState = !prop.isFeatured;
        prop.isFeatured = nextState;
        await prop.save();
      }
    } catch (e) {
      const found = inMemoryProperties.find(p => p.id === id || p.customId === id);
      if (found) {
        nextState = !found.isFeatured;
        found.isFeatured = nextState;
      }
    }

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
    try {
      await Property.findOneAndDelete({ customId: id });
    } catch (e) {
      inMemoryProperties = inMemoryProperties.filter(p => p.id !== id && p.customId !== id);
    }
    return successResponse(res, 200, 'Property listing permanently deleted');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updatePropertyStatus,
  togglePropertyFeatured,
  deleteProperty,
};
