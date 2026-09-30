const express = require('express');
const router = express.Router();
const {
  getOwners,
  approveKyc,
  rejectKyc,
  toggleBlockOwner,
} = require('../controllers/kycController');

router.get('/owners', getOwners);
router.patch('/:id/approve', approveKyc);
router.patch('/:id/reject', rejectKyc);
router.patch('/:id/toggle-block', toggleBlockOwner);

module.exports = router;
