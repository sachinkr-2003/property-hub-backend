const express = require('express');
const router = express.Router();
const {
  getOwners,
  approveKyc,
  rejectKyc,
  toggleBlockOwner,
  submitKyc,
  getKycStatus,
} = require('../controllers/kycController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/owners', protect, authorize('Super Admin', 'Staff'), getOwners);
router.post('/submit', submitKyc);
router.get('/status/:mobile', getKycStatus);
router.patch('/:id/approve', protect, authorize('Super Admin', 'Staff'), approveKyc);
router.patch('/:id/reject', protect, authorize('Super Admin', 'Staff'), rejectKyc);
router.patch('/:id/toggle-block', protect, authorize('Super Admin', 'Staff'), toggleBlockOwner);

module.exports = router;
