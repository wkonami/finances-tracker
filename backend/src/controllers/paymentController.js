const prisma = require('../prismaClient');

async function addPayment(req, res) {

  try {
    const debtId = parseInt(req.params.id);

    if (isNaN(debtId)) {

      return res.status(400).json({
        message: 'ID da dívida inválido'
      });

    }

    const {
      amount,
      note
    } = req.body;

    if (!amount) {

      return res.status(400).json({
        message: 'Valor é obrigatório'
      });

    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        message: 'O valor do pagamento deve ser maior que zero'
      });
    }

    const debt = await prisma.debt.findFirst({

      where: {
        id: debtId,
        userId: req.user.id,
        deletedAt: null
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

          amount: Number(amount),

          paymentDate:
            new Date(),

          note,

          debt: {

            connect: {
              id: debtId
            }

          }

        }

      });

    return res.json(payment);

  }catch(error) {

    console.error({
        error: error.message,
        stack: error.stack,
        endpoint: req.originalUrl,
        method: req.method,
        user: req.user?.id
    });

    return res.status(500).json({
        message: 'Erro interno do servidor'
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
            paymentDate
              ? new Date(paymentDate)
              : undefined,

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