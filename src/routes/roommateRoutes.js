const express = require('express');
const router = express.Router();
const {
  getRoommates,
  createRoommate,
  updateRoommateStatus,
  deleteRoommate,
} = require('../controllers/roommateController');

router.get('/', getRoommates);
router.post('/', createRoommate);
router.patch('/:id/status', updateRoommateStatus);
router.delete('/:id', deleteRoommate);

module.exports = router;
