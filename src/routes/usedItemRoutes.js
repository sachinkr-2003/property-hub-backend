const express = require('express');
const router = express.Router();
const {
  getUsedItems,
  createUsedItem,
  removeUsedItem,
  approveReportedItem,
} = require('../controllers/usedItemController');

router.get('/', getUsedItems);
router.post('/', createUsedItem);
router.delete('/:id', removeUsedItem);
router.patch('/:id/approve', approveReportedItem);

module.exports = router;
