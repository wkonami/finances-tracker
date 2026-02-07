const prisma = require('../prismaClient');

async function addPayment(req, res) {
  const debtId = parseInt(req.params.id);
  const { amount, note } = req.body;
  if (!amount) return res.status(400).json({ message: 'Missing amount' });

  const payment = await prisma.payment.create({
    data: {
      amount: parseFloat(amount),
      debt: { connect: { id: debtId } },
      // note stored in payments table if you add field
    }
  });
  res.json(payment);
}

async function listPayments(req, res) {
  const debtId = parseInt(req.params.id);
  const payments = await prisma.payment.findMany({
    where: { debtId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(payments);
}

module.exports = { addPayment, listPayments };