const express = require('express');
const router = express.Router();
const {
  getUsedItems,
  removeUsedItem,
  approveReportedItem,
} = require('../controllers/usedItemController');

router.get('/', getUsedItems);
router.delete('/:id', removeUsedItem);
router.patch('/:id/approve', approveReportedItem);

module.exports = router;
