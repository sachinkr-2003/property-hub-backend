const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  toggleBlockUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

router.get('/', getUsers);
router.get('/:id', getUserById);
router.patch('/:id/toggle-block', toggleBlockUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
