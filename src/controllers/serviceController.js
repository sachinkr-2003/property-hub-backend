const mongoose = require('mongoose');
const Service = require('../models/Service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all services / providers
// @route   GET /api/services
// @access  Public / Admin
const getServices = async (req, res) => {
  try {
    const { category, search, status } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = { $regex: category, $options: 'i' };
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { provider: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const services = await Service.find(query).sort({ createdAt: -1 });
    return successResponse(res, 200, 'Services fetched successfully from MongoDB', services, {
      total: services.length,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create new service provider
// @route   POST /api/services
// @access  Private (Admin)
const createService = async (req, res) => {
  try {
    const { name, category, provider, phone, priceStarts, status, verified } = req.body;
    if (!name || !category || !provider || !phone) {
      return errorResponse(res, 400, 'Please provide name, category, provider, and phone');
    }

    const count = await Service.countDocuments();
    const customId = `SRV-${String(count + 1).padStart(2, '0')}`;

    const service = await Service.create({
      customId,
      name,
      category,
      provider,
      phone,
      priceStarts: priceStarts || '₹ 199',
      status: status || 'Active',
      verified: verified !== undefined ? verified : true,
    });

    return successResponse(res, 201, 'Service provider onboarded successfully into MongoDB', service);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Toggle service provider status (Active / Suspended)
// @route   PATCH /api/services/:id/status
// @access  Private (Admin)
const toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const service = await Service.findOne(query);
    if (!service) {
      return errorResponse(res, 404, 'Service provider not found');
    }

    service.status = service.status === 'Active' ? 'Suspended' : 'Active';
    await service.save();

    return successResponse(res, 200, `Service status updated to ${service.status}`, service);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Delete service provider
// @route   DELETE /api/services/:id
// @access  Private (Admin)
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const service = await Service.findOneAndDelete(query);
    if (!service) {
      return errorResponse(res, 404, 'Service provider not found');
    }

    return successResponse(res, 200, `Service provider ${id} removed successfully from MongoDB`);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getServices,
  createService,
  toggleServiceStatus,
  deleteService,
};
