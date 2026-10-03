const mongoose = require('mongoose');
const UsedItem = require('../models/UsedItem');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const { initialUsedItems } = require('../seed/mockSource');

// @desc    Get all used items
// @route   GET /api/used-items
// @access  Public / Admin
const getUsedItems = async (req, res) => {
  try {
    const { category, reported, search, status } = req.query;
    const query = {};

    const count = await UsedItem.countDocuments();
    if (count === 0 && initialUsedItems && initialUsedItems.length > 0) {
      try {
        await UsedItem.insertMany(initialUsedItems);
      } catch (seedErr) {
        console.warn('[USED ITEMS] Auto-seed error:', seedErr.message);
      }
    }

    if (category && category !== 'All') {
      query.category = { $regex: category, $options: 'i' };
    }
    if (reported !== undefined && reported !== '') {
      query.reported = reported === 'true';
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { sellerName: { $regex: search, $options: 'i' } },
        { locality: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await UsedItem.find(query).sort({ createdAt: -1 });
    return successResponse(res, 200, 'Used marketplace items fetched successfully from MongoDB', items, {
      total: items.length,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create new used item listing
// @route   POST /api/used-items
// @access  Public / Tenant
const createUsedItem = async (req, res) => {
  try {
    const sName = sellerName || req.body.ownerName || req.body.userName || 'Verified Seller';
    const sPhone = phone || req.body.sellerPhone || req.body.ownerPhone || req.body.userPhone || '+91 98765 43210';
    const numPrice = Number(String(price || '1000').replace(/[^0-9.]/g, '')) || 1000;

    if (!title) {
      return errorResponse(res, 400, 'Please provide item title');
    }

    const count = await UsedItem.countDocuments();
    const customId = `ITEM-${String(count + 301)}`;

    const newItem = await UsedItem.create({
      customId,
      title,
      category: category || 'Furniture',
      price: numPrice,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      sellerName: sName,
      phone: sPhone,
      locality: locality || req.body.location || 'Lucknow',
      condition: condition || 'Good Condition',
      image: image || req.body.imageUrl || '',
      status: 'Active',
      reported: false,
    });

    return successResponse(res, 201, 'Used item listed successfully in MongoDB', newItem);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Remove / Delete marketplace item
// @route   DELETE /api/used-items/:id
// @access  Private (Admin)
const removeUsedItem = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const item = await UsedItem.findOneAndDelete(query);
    if (!item) {
      return errorResponse(res, 404, 'Marketplace item not found');
    }

    return successResponse(res, 200, `Marketplace item ${id} purged successfully from MongoDB`);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Approve / Clear abuse report on used item
// @route   PATCH /api/used-items/:id/approve
// @access  Private (Admin)
const approveReportedItem = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const item = await UsedItem.findOne(query);
    if (!item) {
      return errorResponse(res, 404, 'Item not found');
    }

    item.reported = false;
    item.status = 'Active';
    await item.save();

    return successResponse(res, 200, 'Report cleared, item restored to active marketplace in MongoDB', item);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getUsedItems,
  createUsedItem,
  removeUsedItem,
  approveReportedItem,
};
