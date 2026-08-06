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
        notes,
        userId: req.user.id
      }
    });

    return res.json(debt);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: 'Erro ao criar dívida'
    });

  }
}

async function listDebts(req, res) {

  try {

    const debts = await prisma.debt.findMany({

      where: {
        userId: req.user.id,
        deletedAt: null
      },

      include: {
        payments: true
      },

      orderBy: {
        createdAt: 'desc'
      }

    });

    const formattedDebts = debts.map((debt) => {

      const totalPaid = debt.payments.reduce(

        (sum, payment) => sum + Number(payment.amount),

        0

      );

      const totalOpen =
        Number(debt.totalAmount) - totalPaid;

      const isPaid = totalOpen <= 0;

      const isClosed =
        debt.delivered && isPaid;

      return {
        ...debt,
        totalPaid,
        totalOpen,
        isPaid,
        isClosed
      };

    });

    const openDebts =
      formattedDebts.filter(d => !d.isClosed);

    const closedDebts =
      formattedDebts.filter(d => d.isClosed);

    const totalOpen =
      openDebts.reduce(
        (sum, debt) => sum + debt.totalOpen,
        0
      );

    const totalPaid =
      formattedDebts.reduce(
        (sum, debt) => sum + debt.totalPaid,
        0
      );

    return res.json({

      summary: {

        totalOpen,

        totalPaid,

        openCount: openDebts.length,

        closedCount: closedDebts.length

      },

      debts: openDebts,

      closedDebts

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({

      message: 'Erro ao listar dívidas'

    });

  }

}

async function getDebt(req, res) {

  try {

    const id = Number(req.params.id);

    const debt = await prisma.debt.findFirst({

      where: {

        id,

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

    const totalOpen =
      Number(debt.totalAmount) - totalPaid;

    const isPaid = totalOpen <=0;

    const isClosed =
      debt.delivered && isPaid

    return res.json({
      ...debt,
      totalPaid,
      totalOpen,
      isPaid,
      isClosed
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({

      message: 'Erro ao buscar dívida'

    });

  }

}

async function updateDebt(req, res) {

  try {

    const id = Number(req.params.id);

    const debt = await prisma.debt.findFirst({

      where: {
        id,
        userId: req.user.id,
        deletedAt: null
      }

    });

    if (!debt) {

      return res.status(404).json({

        message: 'Dívida não encontrada'

      });

    }

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

    return res.json(updated);

  } catch (error) {

    console.error(error);

    return res.status(500).json({

      message: 'Erro ao atualizar dívida'

    });

  }

}

async function deleteDebt(req, res) {

  try {

    const id = Number(req.params.id);

    const debt = await prisma.debt.findFirst({

      where: {
        id,
        userId: req.user.id,
        deletedAt: null
      }

    });

    if (!debt) {

      return res.status(404).json({

        message: 'Dívida não encontrada'

      });

    }

    await prisma.debt.update({

      where: {
        id
      },

      data: {

        deletedAt: new Date()

      }

    });

    return res.json({

      message: 'Dívida arquivada'

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({

      message: 'Erro ao arquivar dívida'

    });

  }

}

async function markAsDelivered(req, res) {

  try {

    const id = Number(req.params.id);

    const debt = await prisma.debt.findFirst({

      where: {
        id,
        userId: req.user.id,
        deletedAt: null
      }

    });

    if (!debt) {

      return res.status(404).json({
        message: 'Dívida não encontrada'
      });

    }

    if (debt.delivered) {

      return res.status(400).json({
        message: 'Esta dívida já foi marcada como entregue.'
      });

    }

    const updatedDebt = await prisma.debt.update({

      where: {
        id
      },

      data: {
        delivered: true
      }

    });

    return res.json(updatedDebt);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: 'Erro ao marcar dívida como entregue'
    });

  }

}

module.exports = {

  createDebt,

  listDebts,

  getDebt,

  updateDebt,

  deleteDebt,

  markAsDelivered

};