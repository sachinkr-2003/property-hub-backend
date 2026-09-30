const Service = require('../models/Service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const mockServices = [
  {
    id: "SRV-01",
    customId: "SRV-01",
    name: "Annapurna Homestyle Tiffin & Mess",
    category: "Tiffin / Mess",
    provider: "Manoj Tiwari",
    phone: "+91 98399 11001",
    rating: 4.8,
    orders: 840,
    priceStarts: "₹ 75 / meal",
    status: "Active",
    complaints: 1,
    verified: true
  },
  {
    id: "SRV-02",
    customId: "SRV-02",
    name: "SpeedyWash Laundry & Dry Cleaners",
    category: "Laundry",
    provider: "Suresh Kashyap",
    phone: "+91 94150 22334",
    rating: 4.7,
    orders: 412,
    priceStarts: "₹ 15 / cloth",
    status: "Active",
    complaints: 0,
    verified: true
  }
];

let inMemoryServices = [...mockServices];

const getServices = async (req, res) => {
  try {
    const { category, search } = req.query;
    let list = inMemoryServices;
    if (category && category !== 'All') {
      list = list.filter(s => s.category.toLowerCase().includes(category.toLowerCase()));
    }
    if (search) {
      list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.provider.toLowerCase().includes(search.toLowerCase()));
    }
    return successResponse(res, 200, 'Services fetched successfully', list);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const found = inMemoryServices.find(s => s.id === id || s.customId === id);
    if (found) {
      found.status = found.status === 'Active' ? 'Suspended' : 'Active';
      return successResponse(res, 200, `Service status set to ${found.status}`, { status: found.status });
    }
    return errorResponse(res, 404, 'Service provider not found');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getServices,
  toggleServiceStatus,
};
