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
      message: 'O valor do pagamento deve ser maior que zero'
    };
  }

  if (amount > MAX_PAYMENT_AMOUNT) {
    return {
      valid: false,
      message: 'O valor do pagamento é muito alto'
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
      message: `A observação deve possuir no máximo ${MAX_NOTE_LENGTH} caracteres`
    };
  }

  return {
    valid: true,
    value: trimmedNote || null
  };
}

function validatePaymentDate(value) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return {
      valid: false,
      message: 'Data de pagamento inválida'
    };
  }

  return {
    valid: true,
    value: parsedDate
  };
}

async function addPayment(req, res) {
  try {
    const saleId = Number(req.params.id);

    if (!Number.isInteger(saleId) || saleId <= 0) {
      return res.status(400).json({
        message: 'ID da venda inválido'
      });
    }

    const {
      amount,
      note
    } = req.body;

    const amountValidation = validateAmount(amount);

    if (!amountValidation.valid) {
      return res.status(400).json({
        message: amountValidation.message
      });
    }

    const noteValidation = validateNote(note);

    if (!noteValidation.valid) {
      return res.status(400).json({
        message: noteValidation.message
      });
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        userId: req.user.id,
        deletedAt: null
      },
      include: {
        payments: true
      }
    });

    if (!sale) {
      return res.status(404).json({
        message: 'Venda não encontrada'
      });
    }

    const totalPaid = sale.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const newTotalPaid =
      totalPaid + amountValidation.amount;

    if (newTotalPaid > Number(sale.totalAmount) + 0.01) {
      return res.status(400).json({
        message: 'Pagamento ultrapassa o valor total da venda'
      });
    }

    const payment = await prisma.payment.create({
      data: {
        amount: amountValidation.amount,
        paymentDate: new Date(),
        note: noteValidation.value,
        sale: {
          connect: {
            id: saleId
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
    const paymentId = Number(req.params.paymentId);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({
        message: 'ID do pagamento inválido'
      });
    }

    const {
      amount,
      paymentDate,
      note
    } = req.body;

    const data = {};

    if (amount !== undefined) {
      const amountValidation = validateAmount(amount);

      if (!amountValidation.valid) {
        return res.status(400).json({
          message: amountValidation.message
        });
      }

      data.amount = amountValidation.amount;
    }

    if (paymentDate !== undefined) {
      const dateValidation = validatePaymentDate(paymentDate);

      if (!dateValidation.valid) {
        return res.status(400).json({
          message: dateValidation.message
        });
      }

      data.paymentDate = dateValidation.value;
    }

    if (note !== undefined) {
      const noteValidation = validateNote(note);

      if (!noteValidation.valid) {
        return res.status(400).json({
          message: noteValidation.message
        });
      }

      data.note = noteValidation.value;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: 'Nenhuma alteração foi informada'
      });
    }

    const existingPayment = await prisma.payment.findUnique({
      where: {
        id: paymentId
      },
      include: {
        sale: {
          include: {
            payments: true
          }
        }
      }
    });

    if (
      !existingPayment ||
      existingPayment.sale.userId !== req.user.id ||
      existingPayment.sale.deletedAt !== null
    ) {
      return res.status(404).json({
        message: 'Pagamento não encontrado'
      });
    }

    const sale = existingPayment.sale;

    if (amount !== undefined) {
      const otherPaymentsTotal = sale.payments.reduce(
        (sum, payment) => {
          if (payment.id === paymentId) {
            return sum;
          }

          return sum + Number(payment.amount);
        },
        0
      );

      const futureTotal =
        otherPaymentsTotal + data.amount;

      if (futureTotal > Number(sale.totalAmount) + 0.01) {
        return res.status(400).json({
          message: 'Pagamento ultrapassa o valor total da venda'
        });
      }
    }

    const updatedPayment = await prisma.payment.update({
      where: {
        id: paymentId
      },
      data
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
    const saleId = Number(req.params.id);

    if (!Number.isInteger(saleId) || saleId <= 0) {
      return res.status(400).json({
        message: 'ID da venda inválido'
      });
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        userId: req.user.id,
        deletedAt: null
      }
    });

    if (!sale) {
      return res.status(404).json({
        message: 'Venda não encontrada'
      });
    }

    const payments = await prisma.payment.findMany({
      where: {
        saleId
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

async function deletePayment(req, res) {
  try {
    const paymentId = Number(req.params.paymentId);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({
        message: 'ID do pagamento inválido'
      });
    }

    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId
      },
      include: {
        sale: true
      }
    });

    if (
      !payment ||
      payment.sale.userId !== req.user.id ||
      payment.sale.deletedAt !== null
    ) {
      return res.status(404).json({
        message: 'Pagamento não encontrado'
      });
    }

    await prisma.payment.delete({
      where: {
        id: paymentId
      }
    });

    return res.json({
      message: 'Pagamento excluído com sucesso'
    });

  } catch (error) {
    console.error({
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      paymentId: req.params.paymentId
    });

    return res.status(500).json({
      message: 'Erro interno ao excluir pagamento'
    });
  }
}

module.exports = {
  addPayment,
  listPayments,
  updatePayment,
  deletePayment
};