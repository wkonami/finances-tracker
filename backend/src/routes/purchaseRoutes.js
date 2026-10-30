const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');

const {
  createPurchase,
  listPurchases,
  getPurchase,
  updatePurchase,
  deletePurchase
} = require('../controllers/purchaseController');

const {
  addPurchasePayment,
  listPurchasePayments,
  updatePurchasePayment,
  deletePurchasePayment
} = require('../controllers/purchasePaymentController');

router.use(authMiddleware);

router.post('/', createPurchase);
router.get('/', listPurchases);

router.post('/:id/payments', addPurchasePayment);
router.get('/:id/payments', listPurchasePayments);

router.put('/payments/:paymentId', updatePurchasePayment);
router.delete('/payments/:paymentId', deletePurchasePayment);

router.get('/:id', getPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

module.exports = router;