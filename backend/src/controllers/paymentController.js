const prisma = require('../prismaClient');

async function addPayment(req, res) {
  const debtId = parseInt(req.params.id);

  const { amount, paymentDate } = req.body;

  // validações
  if (!amount) {
    return res.status(400).json({
      message: 'Missing amount'
    });
  }

  if (!paymentDate) {
    return res.status(400).json({
      message: 'Missing payment date'
    });
  }

  try {

    const payment = await prisma.payment.create({
      data: {

        // valor pago
        amount: parseFloat(amount),

        // data informada manualmente
        paymentDate: new Date(paymentDate),

        // relação com dívida
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
      message: 'Error creating payment'
    });

  }
}

async function listPayments(req, res) {

  const debtId = parseInt(req.params.id);

  try {

    const payments = await prisma.payment.findMany({

      where: {
        debtId
      },

      // ordena pela data do pagamento
      orderBy: {
        paymentDate: 'desc'
      }

    });

    res.json(payments);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Error listing payments'
    });

  }
}

module.exports = {
  addPayment,
  listPayments
};