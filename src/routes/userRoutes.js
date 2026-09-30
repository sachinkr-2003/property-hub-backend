const express = require('express');
const router = express.Router();
const { getUsers, toggleBlockUser } = require('../controllers/userController');

router.get('/', getUsers);
router.patch('/:id/toggle-block', toggleBlockUser);

module.exports = router;
