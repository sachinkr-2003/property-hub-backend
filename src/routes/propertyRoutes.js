const express = require('express');
const router = express.Router();
const {
  getProperties,
  getPropertyById,
  createProperty,
  updatePropertyStatus,
  togglePropertyFeatured,
  deleteProperty,
} = require('../controllers/propertyController');

router.route('/')
  .get(getProperties)
  .post(createProperty);

router.route('/:id')
  .get(getPropertyById)
  .delete(deleteProperty);

router.patch('/:id/status', updatePropertyStatus);
router.patch('/:id/featured', togglePropertyFeatured);

module.exports = router;
