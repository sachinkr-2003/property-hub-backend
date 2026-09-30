const UsedItem = require('../models/UsedItem');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const mockItems = [
  {
    id: "ITEM-301",
    customId: "ITEM-301",
    title: "Solid Sheesham Wood Queen Bed with Storage",
    category: "Furniture",
    price: 11500,
    originalPrice: 24000,
    sellerName: "Tanmay Gupta (Tenant)",
    phone: "+91 98190 77123",
    locality: "Mahanagar, Lucknow",
    status: "Active",
    condition: "Like New (1 yr used)",
    reported: false,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80",
    postedAt: "2026-09-28"
  },
  {
    id: "ITEM-302",
    customId: "ITEM-302",
    title: "LG 260L 3-Star Inverter Frost-Free Refrigerator",
    category: "Appliances",
    price: 13500,
    originalPrice: 28000,
    sellerName: "Neha Rastogi",
    phone: "+91 94151 33445",
    locality: "Gomti Nagar, Lucknow",
    status: "Active",
    condition: "Excellent Working Condition",
    reported: true,
    image: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=400&q=80",
    postedAt: "2026-09-29"
  }
];

let inMemoryItems = [...mockItems];

const getUsedItems = async (req, res) => {
  try {
    const { category, reported, search } = req.query;
    let list = inMemoryItems;
    if (category && category !== 'All') {
      list = list.filter(i => i.category.toLowerCase().includes(category.toLowerCase()));
    }
    if (reported === 'true') {
      list = list.filter(i => i.reported);
    }
    if (search) {
      list = list.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.sellerName.toLowerCase().includes(search.toLowerCase()));
    }
    return successResponse(res, 200, 'Used marketplace items fetched successfully', list);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const removeUsedItem = async (req, res) => {
  try {
    const { id } = req.params;
    inMemoryItems = inMemoryItems.filter(i => i.id !== id && i.customId !== id);
    return successResponse(res, 200, `Marketplace item ${id} purged successfully`);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const approveReportedItem = async (req, res) => {
  try {
    const { id } = req.params;
    const found = inMemoryItems.find(i => i.id === id || i.customId === id);
    if (found) {
      found.reported = false;
      found.status = 'Active';
      return successResponse(res, 200, 'Report cleared, item restored to marketplace');
    }
    return errorResponse(res, 404, 'Item not found');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getUsedItems,
  removeUsedItem,
  approveReportedItem,
};
