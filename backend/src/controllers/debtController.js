const prisma = require('../prismaClient');

const MAX_DEBTOR_NAME_LENGTH = 100;
const MAX_NOTES_LENGTH = 500;
const MAX_DEBT_AMOUNT = 99999999.99;

function validateAmount(value) {

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return {
      valid: false,
      message: 'Valor inválido'
    };
  }

  if (amount <= 0) {
    return {
      valid: false,
      message: 'O valor deve ser maior que zero'
    };
  }

  if (amount > MAX_DEBT_AMOUNT) {
    return {
      valid: false,
      message: 'O valor é muito alto'
    };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(String(value))) {
    return {
      valid: false,
      message: 'O valor deve possuir no máximo 2 casas decimais'
    };
  }

  return {
    valid: true,
    amount
  };
}

function validateNotes(notes) {

  if (notes === undefined || notes === null || notes === '') {
    return {
      valid: true,
      value: null
    };
  }

  if (typeof notes !== 'string') {
    return {
      valid: false,
      message: 'Observação inválida'
    };
  }

  const trimmedNotes = notes.trim();

  if (trimmedNotes.length > MAX_NOTES_LENGTH) {
    return {
      valid: false,
      message: `A observação deve possuir no máximo ${MAX_NOTES_LENGTH} caracteres`
    };
  }

  return {
    valid: true,
    value: trimmedNotes || null
  };
}

function validateDebtorName(name) {

  if (
    typeof name !== 'string' ||
    !name.trim()
  ) {
    return {
      valid: false,
      message: 'Nome é obrigatório'
    };
  }

  const trimmedName = name.trim();

  if (
    trimmedName.length >
    MAX_DEBTOR_NAME_LENGTH
  ) {
    return {
      valid: false,
      message:
        `O nome deve possuir no máximo ${MAX_DEBTOR_NAME_LENGTH} caracteres`
    };
  }

  return {
    valid: true,
    value: trimmedName
  };
}

async function createDebt(req, res) {

  try {

    const {
      debtorName,
      totalAmount,
      notes
    } = req.body;

    const nameValidation =
      validateDebtorName(debtorName);

    if (!nameValidation.valid) {

      return res.status(400).json({
        message: nameValidation.message
      });

    }

    if (
      totalAmount === undefined ||
      totalAmount === null ||
      totalAmount === ''
    ) {

      return res.status(400).json({
        message: 'Valor é obrigatório'
      });

    }

    const amountValidation =
      validateAmount(totalAmount);

    if (!amountValidation.valid) {

      return res.status(400).json({
        message: amountValidation.message
      });

    }

    const notesValidation =
      validateNotes(notes);

    if (!notesValidation.valid) {

      return res.status(400).json({
        message: notesValidation.message
      });

    }

    const debt = await prisma.debt.create({

      data: {

        debtorName: nameValidation.value,

        totalAmount: amountValidation.amount,

        notes: notesValidation.value,

        userId: req.user.id

      }

    });

    return res.status(201).json(debt);

  } catch (error) {

    console.error({
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id
    });

    return res.status(500).json({
      message: 'Erro interno'
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

    const formattedDebts =
      debts.map((debt) => {

        const totalPaid =
          debt.payments.reduce(

            (sum, payment) =>
              sum + Number(payment.amount),

            0

          );

        const totalOpen =
          Number(debt.totalAmount) -
          totalPaid;

        const normalizedTotalOpen = 
          Math.max(totalOpen, 0);

        const isPaid =
          normalizedTotalOpen <= 0;

        const isClosed =
          debt.delivered &&
          isPaid;

        return {

          ...debt,

          totalPaid,

          totalOpen:
            normalizedTotalOpen,

          isPaid,

          isClosed

        };

      });

    const openDebts =
      formattedDebts.filter(d => !d.isClosed);

    const closedDebts =
      formattedDebts.filter(d => d.isClosed);

    const totalOpen =
      formattedDebts.reduce(
        (sum, debt) => sum + Math.max(debt.totalOpen, 0),
        0
      );

    const totalPaid =
      formattedDebts.reduce(
        (sum, debt) => sum + debt.totalPaid,
        0
      );

    const pendingDeliveries =
      formattedDebts.filter(
        debt => !debt.delivered
      ).length;

    const awaitingPayment =
      formattedDebts.filter(
        debt => !debt.isPaid
      ).length;

    return res.json({

      summary: {
        totalOpen,
        totalPaid,
        pendingDeliveries,
        awaitingPayment,
        openCount: openDebts.length,
        closedCount: closedDebts.length
      },

      debts: openDebts,

      closedDebts

    });

  } catch (error) {

    console.error({
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id
    });

    return res.status(500).json({
      message: 'Erro interno ao listar dívidas'
    });

  }

}

async function getDebt(req, res) {

  try {

    const id =
      Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {

      return res.status(400).json({
        message: 'ID inválido'
      });

    }

    const debt =
      await prisma.debt.findFirst({

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
      Number(debt.totalAmount) -
      totalPaid;

    const normalizedTotalOpen = 
      Math.max(totalOpen, 0);

    const isPaid =
      normalizedTotalOpen <= 0;

    const isClosed =
      debt.delivered &&
      isPaid;

    return res.json({

      ...debt,

      totalPaid,

      totalOpen,

      isPaid,

      isClosed

    });

  } catch (error) {

    console.error({
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id
    });

    return res.status(500).json({
      message: 'Erro interno ao buscar dívida'
    });

  }

}

async function updateDebt(req, res) {

  try {

    const id =
      Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {

      return res.status(400).json({
        message: 'ID inválido'
      });

    }

    const debt =
      await prisma.debt.findFirst({

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

    const {
      debtorName,
      totalAmount,
      notes
    } = req.body;

    const data = {};

    if (debtorName !== undefined) {
      const nameValidation =
        validateDebtorName(
          debtorName
        );
      
      if (!nameValidation.valid) {
        return res.status(400).json({
          message:
            nameValidation.message
        });
      }
      data.debtorName =
        nameValidation.value;
    }

    if (totalAmount !== undefined) {

      const amountValidation =
        validateAmount(totalAmount);

      if (!amountValidation.valid) {

        return res.status(400).json({
          message: amountValidation.message
        });

      }

      const totalPaid =
        debt.payments.reduce(
          (sum, payment) =>
            sum + Number(payment.amount),
          0
      );

      if (amountValidation.amount < totalPaid) {
        return res.status(400).json({
          message: `O valor total não pode ser menor que o valor já pago (R$ ${totalPaid.toFixed(2)})`
        })
      }

      data.totalAmount =
        amountValidation.amount;

    }

    if (notes !== undefined) {

      const notesValidation =
        validateNotes(notes);

      if (!notesValidation.valid) {

        return res.status(400).json({
          message: notesValidation.message
        });

      }

      data.notes =
        notesValidation.value;

    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: 'Nenhuma alteração foi informada'
      });
    }

    const updated =
      await prisma.debt.update({

        where: {
          id
        },

        data

      });

    return res.json(updated);

  } catch (error) {

    console.error({
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id
    });

    return res.status(500).json({
      message: 'Erro interno ao atualizar dívida'
    });

  }

}

async function deleteDebt(req, res) {

  try {

    const id =
      Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {

      return res.status(400).json({
        message: 'ID da dívida inválido'
      });

    }

    const debt =
      await prisma.debt.findFirst({

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

        deletedAt:
          new Date()

      }

    });

    return res.json({
      message: 'Dívida arquivada'
    });

  } catch (error) {

    console.error({
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id
    });

    return res.status(500).json({
      message: 'Erro interno ao arquivar dívida'
    });

  }

}

async function markAsDelivered(req, res) {

  try {

    const id =
      Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {

      return res.status(400).json({
        message: 'ID da dívida inválido'
      });

    }

    const debt =
      await prisma.debt.findFirst({

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
        message:
          'Esta dívida já foi marcada como entregue.'
      });

    }

    const updatedDebt =
      await prisma.debt.update({

        where: {
          id
        },

        data: {
          delivered: true
        }

      });

    return res.json(updatedDebt);

  } catch (error) {

    console.error({
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id
    });

    return res.status(500).json({
      message: 'Erro interno ao marcar dívida como entregue'
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