const express = require('express');
const router = express.Router();
const {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  updatePropertyStatus,
  togglePropertyFeatured,
  deleteProperty,
} = require('../controllers/propertyController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getProperties)
  .post(createProperty);

router.route('/:id')
  .get(getPropertyById)
  .put(updateProperty)
  .patch(updateProperty)
  .delete(deleteProperty);

router.patch('/:id/status', protect, authorize('Super Admin', 'Staff'), updatePropertyStatus);
router.patch('/:id/featured', protect, authorize('Super Admin', 'Staff'), togglePropertyFeatured);

module.exports = router;
