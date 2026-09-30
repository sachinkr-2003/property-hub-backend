const express = require('express');
const router = express.Router();
const { adminLogin, phoneLogin } = require('../controllers/authController');

router.post('/admin-login', adminLogin);
router.post('/phone-login', phoneLogin);

module.exports = router;
