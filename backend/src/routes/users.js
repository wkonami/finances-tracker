const express = require('express');

const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');

const userController = require('../controllers/userController');

router.use(authMiddleware);

router.get(
  '/',
  authorize('ADMIN'),
  userController.listUsers
);

router.get(
  '/:id',
  authorize('ADMIN'),
  userController.getUser
);

router.post(
  '/',
  authorize('ADMIN'),
  userController.createUser
);

router.put(
  '/:id',
  authorize('ADMIN'),
  userController.updateUser
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  userController.deleteUser
);

module.exports = router;