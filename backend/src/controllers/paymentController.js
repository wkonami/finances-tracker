const prisma = require('../prismaClient');

async function addPayment(req, res) {
  try {
    const debtId = parseInt(req.params.id);

    const {
      amount,
      paymentDate,
      note
    } = req.body;

    if (!amount || !paymentDate) {
      return res.status(400).json({
        message: 'Valor e data são obrigatórios'
      });
    }

    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),

        paymentDate: new Date(paymentDate),

        note,

        debt: {
          connect: {
            id: debtId
          }
        }
      }
    });

    res.json(payment);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Erro ao adicionar pagamento'
    });
  }
}

async function listPayments(req, res) {

  const debtId = parseInt(req.params.id);

  const payments = await prisma.payment.findMany({
    where: {
      debtId
    },

    orderBy: {
      paymentDate: 'desc'
    }
  });

  res.json(payments);
}

module.exports = {
  addPayment,
  listPayments
};