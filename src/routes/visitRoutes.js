const express = require('express');
const router = express.Router();
const {
  getVisits,
  createVisit,
  updateVisitStatus,
  deleteVisit,
} = require('../controllers/visitController');

router.get('/', getVisits);
router.post('/', createVisit);
router.patch('/:id/status', updateVisitStatus);
router.delete('/:id', deleteVisit);

module.exports = router;
