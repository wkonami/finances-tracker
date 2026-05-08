const express = require('express');

const router = express.Router();

const authMiddleware =
  require('../middlewares/authMiddleware');

const {
  createDebt,
  listDebts,
  getDebt,
  updateDebt,
  deleteDebt
} = require('../controllers/debtController');

const {
  addPayment,
  listPayments
} = require('../controllers/paymentController');

router.use(authMiddleware);

// dívidas
router.post('/', createDebt);

router.get('/', listDebts);

router.get('/:id', getDebt);

router.put('/:id', updateDebt);

router.delete('/:id', deleteDebt);

// pagamentos
router.post('/:id/payments', addPayment);

router.get('/:id/payments', listPayments);

module.exports = router;