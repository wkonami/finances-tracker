const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const debtController = require('../controllers/debtController');
const paymentController = require('../controllers/paymentController');

router.use(auth);

// debts
router.post('/', debtController.createDebt);
router.get('/', debtController.listDebts);
router.get('/:id', debtController.getDebt);
router.put('/:id', debtController.updateDebt);

// payments
router.post('/:id/payments', paymentController.addPayment);
router.get('/:id/payments', paymentController.listPayments);

module.exports = router;