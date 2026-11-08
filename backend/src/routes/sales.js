const express = require('express');

const router = express.Router();

const authMiddleware =
  require('../middlewares/authMiddleware');

const {
  createSale,
  listSales,
  getSale,
  updateSale,
  deleteSale,
  markAsDelivered,
  markAsNotDelivered
} = require('../controllers/saleController');

const {
  addPayment,
  listPayments,
  updatePayment,
  deletePayment
} = require('../controllers/salePaymentController');

router.use(authMiddleware);

// dívidas
router.post('/', createSale);

router.get('/', listSales);


// pagamentos
router.post('/:id/payments', addPayment);

router.get('/:id/payments', listPayments);

router.put('/payments/:paymentId', updatePayment);

router.delete('/payments/:paymentId', deletePayment);

// detalhes da dívida
router.get('/:id', getSale);

router.patch('/:id/delivered', markAsDelivered);

router.patch('/:id/not-delivered', markAsNotDelivered);

router.put('/:id', updateSale);

router.delete('/:id', deleteSale);

module.exports = router;