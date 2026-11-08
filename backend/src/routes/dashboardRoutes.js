const express = require('express');

const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');

const {
  getFinancialFlow
} = require('../controllers/dashboardController');

router.use(authMiddleware);

router.get('/financial-flow', getFinancialFlow);

module.exports = router;