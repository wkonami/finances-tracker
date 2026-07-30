const express = require('express');

const router = express.Router();

const authMiddleware = require('../middlewares/auth');

const roleMiddleware = require('../middlewares/role');

const userController = require('../controllers/userController');

router.use(authMiddleware);

router.get(
  '/',
  roleMiddleware('ADMIN'),
  userController.listUsers
);

router.get(
  '/:id',
  roleMiddleware('ADMIN'),
  userController.getUser
);

router.post(
  '/',
  roleMiddleware('ADMIN'),
  userController.createUser
);

router.put(
  '/:id',
  roleMiddleware('ADMIN'),
  userController.updateUser
);

router.delete(
  '/:id',
  roleMiddleware('ADMIN'),
  userController.deleteUser
);

module.exports = router;