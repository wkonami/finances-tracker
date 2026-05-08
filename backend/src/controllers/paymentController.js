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

    const debt = await prisma.debt.findUnique({

      where: {
        id: debtId
      },

      include: {
        payments: true
      }

    });

    if (!debt) {

      return res.status(404).json({
        message: 'Dívida não encontrada'
      });

    }

    const totalPaid =
      debt.payments.reduce(

        (sum, payment) =>

          sum + Number(payment.amount),

        0

      );

    const newTotalPaid =
      totalPaid + Number(amount);

    // tolerância para evitar problemas de precisão decimal
    if (

      newTotalPaid >

      Number(debt.totalAmount) + 0.01

    ) {

      return res.status(400).json({

        message:
          'Pagamento ultrapassa o valor total da dívida'

      });

    }

    const payment =
      await prisma.payment.create({

        data: {

          amount: parseFloat(amount),

          paymentDate:
            new Date(paymentDate),

          note,

          debt: {

            connect: {
              id: debtId
            }

          }

        }

      });

    return res.json(payment);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: 'Erro ao adicionar pagamento'
    });

  }

}

async function updatePayment(req, res) {

  try {

    const paymentId =
      parseInt(req.params.paymentId);

    const {
      amount,
      paymentDate,
      note
    } = req.body;

    const existingPayment =
      await prisma.payment.findUnique({

        where: {
          id: paymentId
        },

        include: {
          debt: {
            include: {
              payments: true
            }
          }
        }

      });

    if (!existingPayment) {

      return res.status(404).json({
        message: 'Pagamento não encontrado'
      });

    }

    const debt =
      existingPayment.debt;

    const otherPaymentsTotal =
      debt.payments.reduce(

        (sum, payment) => {

          if (
            payment.id === paymentId
          ) {
            return sum;
          }

          return (
            sum + Number(payment.amount)
          );

        },

        0

      );

    const futureTotal =
      otherPaymentsTotal +
      Number(amount);

    if (

      futureTotal >

      Number(debt.totalAmount) + 0.01

    ) {

      return res.status(400).json({

        message:
          'Pagamento ultrapassa o valor total da dívida'

      });

    }

    const updatedPayment =
      await prisma.payment.update({

        where: {
          id: paymentId
        },

        data: {

          amount:
            parseFloat(amount),

          paymentDate:
            new Date(paymentDate),

          note

        }

      });

    return res.json(updatedPayment);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: 'Erro ao atualizar pagamento'
    });

  }

}

async function listPayments(req, res) {

  try {

    const debtId =
      parseInt(req.params.id);

    const payments =
      await prisma.payment.findMany({

        where: {
          debtId
        },

        orderBy: {
          paymentDate: 'desc'
        }

      });

    return res.json(payments);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: 'Erro ao listar pagamentos'
    });

  }

}

module.exports = {
  addPayment,
  listPayments,
  updatePayment
};