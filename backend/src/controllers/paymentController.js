const prisma = require('../prismaClient');

const MAX_PAYMENT_AMOUNT = 99999999.99;
const MAX_NOTE_LENGTH = 500;

function validateAmount(value) {

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {

    return {
      valid: false,
      message: 'Valor do pagamento é obrigatório'
    };

  }

  const stringValue = String(value).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(stringValue)) {

    return {
      valid: false,
      message:
        'O valor deve ser um número válido com no máximo 2 casas decimais'
    };

  }

  const amount = Number(stringValue);

  if (!Number.isFinite(amount)) {

    return {
      valid: false,
      message: 'Valor do pagamento inválido'
    };

  }

  if (amount <= 0) {

    return {
      valid: false,
      message:
        'O valor do pagamento deve ser maior que zero'
    };

  }

  if (amount > MAX_PAYMENT_AMOUNT) {

    return {
      valid: false,
      message:
        'O valor do pagamento é muito alto'
    };

  }

  return {
    valid: true,
    amount
  };

}

function validateNote(note) {

  if (
    note === undefined ||
    note === null ||
    note === ''
  ) {

    return {
      valid: true,
      value: null
    };

  }

  if (typeof note !== 'string') {

    return {
      valid: false,
      message: 'Observação inválida'
    };

  }

  const trimmedNote = note.trim();

  if (trimmedNote.length > MAX_NOTE_LENGTH) {

    return {
      valid: false,
      message:
        `A observação deve possuir no máximo ${MAX_NOTE_LENGTH} caracteres`
    };

  }

  return {
    valid: true,
    value: trimmedNote || null
  };

}

async function addPayment(req, res) {

  try {

    const debtId =
      Number(req.params.id);

    if (
      !Number.isInteger(debtId) ||
      debtId <= 0
    ) {

      return res.status(400).json({
        message: 'ID da dívida inválido'
      });

    }

    const {
      amount,
      note
    } = req.body;

    const amountValidation =
      validateAmount(amount);

    if (!amountValidation.valid) {

      return res.status(400).json({
        message: amountValidation.message
      });

    }

    const noteValidation =
      validateNote(note);

    if (!noteValidation.valid) {

      return res.status(400).json({
        message: noteValidation.message
      });

    }

    const debt =
      await prisma.debt.findFirst({

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
      totalPaid +
      amountValidation.amount;

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

          amount:
            amountValidation.amount,

            paymentDate:
            new Date(),

          note:
            noteValidation.value,

          debt: {

            connect: {
              id: debtId
            }

          }

        }

      });

    return res.status(201).json(payment);

  } catch (error) {

    console.error({

      error: error.message,

      stack: error.stack,

      endpoint: req.originalUrl,

      method: req.method,

      userId: req.user?.id

    });

    return res.status(500).json({
      message: 'Erro interno ao registrar pagamento'
    });

  }

}

async function updatePayment(req, res) {

  try {

    const paymentId =
      Number(req.params.paymentId);

    if (
      !Number.isInteger(paymentId) ||
      paymentId <= 0
    ) {

      return res.status(400).json({
        message: 'ID do pagamento inválido'
      });

    }

    const {
      amount,
      paymentDate,
      note
    } = req.body;

    const amountValidation =
      validateAmount(amount);

    if (!amountValidation.valid) {

      return res.status(400).json({
        message: amountValidation.message
      });

    }

    const noteValidation =
      validateNote(note);

    if (!noteValidation.valid) {

      return res.status(400).json({
        message: noteValidation.message
      });

    }

    let parsedPaymentDate;

    if (paymentDate !== undefined) {

      parsedPaymentDate =
        new Date(paymentDate);

      if (
        Number.isNaN(
          parsedPaymentDate.getTime()
        )
      ) {

        return res.status(400).json({
          message: 'Data de pagamento inválida'
        });

      }

    }

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

    if (
      debt.userId !== req.user.id
    ) {

      return res.status(404).json({
        message: 'Pagamento não encontrado'
      });

    }

    const otherPaymentsTotal =
      debt.payments.reduce(

        (sum, payment) => {

          if (
            payment.id === paymentId
          ) {

            return sum;

          }

          return (
            sum +
            Number(payment.amount)
          );

        },

        0

      );

    const futureTotal =
      otherPaymentsTotal +
      amountValidation.amount;

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
            amountValidation.amount,

          paymentDate:
            parsedPaymentDate !== undefined
              ? parsedPaymentDate
              : undefined,

          note:
            noteValidation.value

        }

      });

    return res.json(updatedPayment);

  } catch (error) {

    console.error({

      error: error.message,

      stack: error.stack,

      endpoint: req.originalUrl,

      method: req.method,

      userId: req.user?.id

    });

    return res.status(500).json({
      message: 'Erro interno ao atualizar pagamento'
    });

  }

}

async function listPayments(req, res) {

  try {

    const debtId =
      Number(req.params.id);

    if (
      !Number.isInteger(debtId) ||
      debtId <= 0
    ) {

      return res.status(400).json({
        message: 'ID da dívida inválido'
      });

    }

    const debt =
      await prisma.debt.findFirst({

        where: {

          id: debtId,

          userId: req.user.id,

          deletedAt: null

        }

      });

    if (!debt) {

      return res.status(404).json({
        message: 'Dívida não encontrada'
      });

    }

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

    console.error({

      error: error.message,

      stack: error.stack,

      endpoint: req.originalUrl,

      method: req.method,

      userId: req.user?.id

    });

    return res.status(500).json({
      message: 'Erro interno ao listar pagamentos'
    });

  }

}

module.exports = {
  addPayment,
  listPayments,
  updatePayment
};