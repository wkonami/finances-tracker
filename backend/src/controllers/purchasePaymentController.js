const prisma = require('../prismaClient');
const { validateAmount } = require('./purchaseController');

const MAX_NOTES_LENGTH = 500;

function validateNote(value) {
  if (value === undefined || value === null || value === '') {
    return { valid: true, value: null };
  }

  if (typeof value !== 'string') {
    return { valid: false, message: 'Observação inválida' };
  }

  const note = value.trim();

  if (note.length > MAX_NOTES_LENGTH) {
    return {
      valid: false,
      message: `A observação deve possuir no máximo ${MAX_NOTES_LENGTH} caracteres`
    };
  }

  return { valid: true, value: note || null };
}

function validatePaymentDate(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return { valid: false, message: 'Data de pagamento inválida' };
  }

  return { valid: true, value: date };
}

async function findPurchase(id, userId) {
  return prisma.purchase.findFirst({
    where: {
      id,
      userId,
      deletedAt: null
    },
    include: {
      payments: true
    }
  });
}

async function addPurchasePayment(req, res) {
  try {
    const purchaseId = Number(req.params.id);

    if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
      return res.status(400).json({ message: 'ID da compra inválido' });
    }

    const purchase = await findPurchase(purchaseId, req.user.id);

    if (!purchase) {
      return res.status(404).json({ message: 'Compra não encontrada' });
    }

    const amountValidation = validateAmount(req.body.amount);

    if (!amountValidation.valid) {
      return res.status(400).json({
        message: amountValidation.message
      });
    }

    const totalPaid = purchase.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const remaining = Number(purchase.totalAmount) - totalPaid;

    if (amountValidation.amount > remaining) {
      return res.status(400).json({
        message: `O pagamento não pode ultrapassar o valor restante de R$ ${Math.max(remaining, 0).toFixed(2)}`
      });
    }

    const noteValidation = validateNote(req.body.note);
    const dateValidation = validatePaymentDate(req.body.paymentDate);

    if (!noteValidation.valid) {
      return res.status(400).json({ message: noteValidation.message });
    }

    if (!dateValidation.valid) {
      return res.status(400).json({ message: dateValidation.message });
    }

    const payment = await prisma.purchasePayment.create({
      data: {
        purchaseId,
        amount: amountValidation.amount,
        paymentDate: dateValidation.value,
        note: noteValidation.value
      }
    });

    return res.status(201).json(payment);
  } catch (error) {
    console.error('Erro ao registrar pagamento da compra:', error);

    return res.status(500).json({
      message: 'Erro interno ao registrar pagamento'
    });
  }
}

async function listPurchasePayments(req, res) {
  try {
    const purchaseId = Number(req.params.id);

    if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
      return res.status(400).json({ message: 'ID da compra inválido' });
    }

    const purchase = await findPurchase(purchaseId, req.user.id);

    if (!purchase) {
      return res.status(404).json({ message: 'Compra não encontrada' });
    }

    return res.json(purchase.payments);
  } catch (error) {
    console.error('Erro ao listar pagamentos da compra:', error);

    return res.status(500).json({
      message: 'Erro interno ao listar pagamentos'
    });
  }
}

async function updatePurchasePayment(req, res) {
  try {
    const paymentId = Number(req.params.paymentId);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({ message: 'ID do pagamento inválido' });
    }

    const payment = await prisma.purchasePayment.findFirst({
      where: {
        id: paymentId,
        purchase: {
          userId: req.user.id,
          deletedAt: null
        }
      },
      include: {
        purchase: {
          include: { payments: true }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Pagamento não encontrado' });
    }

    const data = {};

    if (req.body.amount !== undefined) {
      const validation = validateAmount(req.body.amount);

      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      const otherPayments = payment.purchase.payments
        .filter(item => item.id !== paymentId)
        .reduce((sum, item) => sum + Number(item.amount), 0);

      const remaining = Number(payment.purchase.totalAmount) - otherPayments;

      if (validation.amount > remaining) {
        return res.status(400).json({
          message: `O pagamento não pode ultrapassar R$ ${Math.max(remaining, 0).toFixed(2)}`
        });
      }

      data.amount = validation.amount;
    }

    if (req.body.note !== undefined) {
      const validation = validateNote(req.body.note);

      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      data.note = validation.value;
    }

    if (req.body.paymentDate !== undefined) {
      const validation = validatePaymentDate(req.body.paymentDate);

      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      data.paymentDate = validation.value;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: 'Nenhuma alteração foi informada'
      });
    }

    const updated = await prisma.purchasePayment.update({
      where: { id: paymentId },
      data
    });

    return res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar pagamento da compra:', error);

    return res.status(500).json({
      message: 'Erro interno ao atualizar pagamento'
    });
  }
}

async function deletePurchasePayment(req, res) {
  try {
    const paymentId = Number(req.params.paymentId);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({ message: 'ID do pagamento inválido' });
    }

    const payment = await prisma.purchasePayment.findFirst({
      where: {
        id: paymentId,
        purchase: {
          userId: req.user.id,
          deletedAt: null
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Pagamento não encontrado' });
    }

    await prisma.purchasePayment.delete({
      where: { id: paymentId }
    });

    return res.json({
      message: 'Pagamento removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir pagamento da compra:', error);

    return res.status(500).json({
      message: 'Erro interno ao excluir pagamento'
    });
  }
}

module.exports = {
  addPurchasePayment,
  listPurchasePayments,
  updatePurchasePayment,
  deletePurchasePayment
};