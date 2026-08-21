const express = require('express');

const router = express.Router();

const authMiddleware =
  require('../middlewares/authMiddleware');

const {
  createDebt,
  listDebts,
  getDebt,
  updateDebt,
  deleteDebt,
  markAsDelivered
} = require('../controllers/debtController');

const {
  addPayment,
  listPayments,
  updatePayment,
  deletePayment
} = require('../controllers/paymentController');

router.use(authMiddleware);

// dívidas
router.post('/', createDebt);

router.get('/', listDebts);


// pagamentos
router.post('/:id/payments', addPayment);

router.get('/:id/payments', listPayments);

router.put('/payments/:paymentId', updatePayment);

router.delete('/payments/:paymentId', deletePayment);

// detalhes da dívida
router.get('/:id', getDebt);

router.patch('/:id/delivered', markAsDelivered);

router.put('/:id', updateDebt);

router.delete('/:id', deleteDebt);

module.exports = router;