const prisma = require('../prismaClient');

async function createDebt(req, res) {

  try {

    const {
      debtorName,
      totalAmount,
      notes
    } = req.body;

    if (!debtorName || totalAmount == null) {

      return res.status(400).json({
        message: 'Nome do devedor e valor são obrigatórios'
      });

    }

    const debt = await prisma.debt.create({

      data: {

        debtorName,

        totalAmount: parseFloat(totalAmount),

        notes

      }

    });

    res.json(debt);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Erro ao criar dívida'
    });

  }

}

async function listDebts(req, res) {

  try {

    const debts = await prisma.debt.findMany({

      include: {

        payments: {

          orderBy: {
            paymentDate: 'desc'
          }

        }

      },

      orderBy: {
        createdAt: 'desc'
      }

    });

    const response = debts.map(debt => {

      const totalPaid = debt.payments.reduce(

        (sum, payment) => {

          return sum + parseFloat(payment.amount);

        },

        0

      );

      return {

        ...debt,

        totalPaid,

        totalOpen:

          parseFloat(debt.totalAmount) - totalPaid

      };

    });

    const totalOpen = response.reduce(

      (sum, debt) => sum + debt.totalOpen,

      0

    );

    const totalPaid = response.reduce(

      (sum, debt) => sum + debt.totalPaid,

      0

    );

    res.json({

      summary: {

        totalOpen,

        totalPaid,

        count: response.length

      },

      debts: response

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Erro ao listar dívidas'
    });

  }

}

async function getDebt(req, res) {

  try {

    const id = parseInt(req.params.id);

    const debt = await prisma.debt.findUnique({

      where: {
        id
      },

      include: {

        payments: {

          orderBy: {
            paymentDate: 'desc'
          }

        }

      }

    });

    if (!debt) {

      return res.status(404).json({
        message: 'Dívida não encontrada'
      });

    }

    const totalPaid = debt.payments.reduce(

      (sum, payment) => {

        return sum + parseFloat(payment.amount);

      },

      0

    );

    res.json({

      ...debt,

      totalPaid,

      totalOpen:

        parseFloat(debt.totalAmount) - totalPaid

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Erro ao buscar dívida'
    });

  }

}

async function updateDebt(req, res) {

  try {

    const id = parseInt(req.params.id);

    const {
      totalAmount,
      notes
    } = req.body;

    const updated = await prisma.debt.update({

      where: {
        id
      },

      data: {

        totalAmount:

          totalAmount !== undefined

            ? parseFloat(totalAmount)

            : undefined,

        notes

      }

    });

    res.json(updated);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Erro ao atualizar dívida'
    });

  }

}

module.exports = {

  createDebt,

  listDebts,

  getDebt,

  updateDebt

};