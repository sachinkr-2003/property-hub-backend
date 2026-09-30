const express = require('express');
const router = express.Router();
const { getServices, toggleServiceStatus } = require('../controllers/serviceController');

router.get('/', getServices);
router.patch('/:id/toggle-status', toggleServiceStatus);

module.exports = router;
