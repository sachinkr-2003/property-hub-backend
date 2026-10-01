const express = require('express');
const router = express.Router();
const { 
  getServices, 
  createService, 
  toggleServiceStatus, 
  deleteService 
} = require('../controllers/serviceController');

router.get('/', getServices);
router.post('/', createService);
router.patch('/:id/status', toggleServiceStatus);
router.patch('/:id/toggle-status', toggleServiceStatus);
router.delete('/:id', deleteService);

module.exports = router;
