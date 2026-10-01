const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const propertyRoutes = require('./propertyRoutes');
const kycRoutes = require('./kycRoutes');
const userRoutes = require('./userRoutes');
const financeRoutes = require('./financeRoutes');
const serviceRoutes = require('./serviceRoutes');
const usedItemRoutes = require('./usedItemRoutes');
const communicationRoutes = require('./communicationRoutes');
const uploadRoutes = require('./uploadRoutes');
const visitRoutes = require('./visitRoutes');
const roommateRoutes = require('./roommateRoutes');
const reportsRoutes = require('./reportsRoutes');

// Root API Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Search & BachelorHub RESTful API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      properties: '/api/properties',
      kyc: '/api/kyc',
      users: '/api/users',
      finance: '/api/finance',
      services: '/api/services',
      usedItems: '/api/used-items',
      communication: '/api/communication',
      upload: '/api/upload',
      visits: '/api/visits',
      roommates: '/api/roommates',
      reports: '/api/reports',
    },
  });
});

// Mount Resource Routers
router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/kyc', kycRoutes);
router.use('/users', userRoutes);
router.use('/finance', financeRoutes);
router.use('/services', serviceRoutes);
router.use('/used-items', usedItemRoutes);
router.use('/communication', communicationRoutes);
router.use('/upload', uploadRoutes);
router.use('/visits', visitRoutes);
router.use('/roommates', roommateRoutes);
router.use('/reports', reportsRoutes);

module.exports = router;
