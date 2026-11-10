const prisma = require('../prismaClient');

const MAX_DESCRIPTION_LENGTH = 200;
const MAX_PURCHASE_AMOUNT = 99999999.99;

function validateDescription(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return {
      valid: false,
      message: 'A descrição é obrigatória'
    };
  }

  const description = value.trim();

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      message: `A descrição deve possuir no máximo ${MAX_DESCRIPTION_LENGTH} caracteres`
    };
  }

  return { valid: true, value: description };
}

function validateAmount(value) {
  const amount = Number(value);

  if (
    value === undefined ||
    value === null ||
    value === '' ||
    !Number.isFinite(amount)
  ) {
    return { valid: false, message: 'Valor inválido' };
  }

  if (amount <= 0) {
    return { valid: false, message: 'O valor deve ser maior que zero' };
  }

  if (amount > MAX_PURCHASE_AMOUNT) {
    return { valid: false, message: 'O valor é muito alto' };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(String(value))) {
    return {
      valid: false,
      message: 'O valor deve possuir no máximo 2 casas decimais'
    };
  }

  return { valid: true, amount };
}

async function validateSupplier(supplierId, userId) {
  if (
    supplierId === undefined ||
    supplierId === null ||
    supplierId === ''
  ) {
    return {
      valid: false,
      message: 'O fornecedor é obrigatório'
    };
  }

  if (
    typeof supplierId !== 'number' &&
    typeof supplierId !== 'string'
  ) {
    return {
      valid: false,
      message: 'Fornecedor inválido'
    };
  }

  if (
    typeof supplierId === 'string' &&
    !/^\d+$/.test(supplierId.trim())
  ) {
    return {
      valid: false,
      message: 'Fornecedor inválido'
    };
  }

  const id = Number(supplierId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return {
      valid: false,
      message: 'Fornecedor inválido'
    };
  }

  const supplier = await prisma.supplier.findFirst({
    where: {
      id,
      userId,
      deletedAt: null
    },
    select: {
      id: true
    }
  });

  if (!supplier) {
    return {
      valid: false,
      message: 'Fornecedor não encontrado ou indisponível'
    };
  }

  return {
    valid: true,
    supplierId: supplier.id
  };
}

function formatPurchase(purchase) {
  const totalPaid = purchase.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const totalOpen = Math.max(
    Number(purchase.totalAmount) - totalPaid,
    0
  );

  return {
    ...purchase,
    totalPaid,
    totalOpen,
    isPaid: totalOpen <= 0
  };
}

async function createPurchase(req, res) {
  try {
    const descriptionValidation = validateDescription(
      req.body.description
    );

    if (!descriptionValidation.valid) {
      return res.status(400).json({
        message: descriptionValidation.message
      });
    }

    const amountValidation = validateAmount(req.body.totalAmount);

    if (!amountValidation.valid) {
      return res.status(400).json({
        message: amountValidation.message
      });
    }

    const supplierValidation = await validateSupplier(
      req.body.supplierId,
      req.user.id
    );

    if (!supplierValidation.valid) {
      return res.status(400).json({
        message: supplierValidation.message
      });
    }

    const { description, totalAmount, notes } = req.body;

    if (
    notes !== undefined &&
    notes !== null &&
    typeof notes !== 'string'
    ) {
    return res.status(400).json({
        message: 'Observação inválida'
    });
    }

    const normalizedNotes = notes?.trim() || null;

    if (normalizedNotes && normalizedNotes.length > 500) {
    return res.status(400).json({
        message: 'A observação deve possuir no máximo 500 caracteres'
    });
    }

    const purchase = await prisma.purchase.create({
      data: {
        description: descriptionValidation.value,
        totalAmount: amountValidation.amount,
        notes: normalizedNotes,
        supplierId: supplierValidation.supplierId,
        userId: req.user.id
      },
      include: {
        payments: true,
        supplier: true
      }
    });

    return res.status(201).json(formatPurchase(purchase));
  } catch (error) {
    console.error('Erro ao criar compra:', error);

    return res.status(500).json({
      message: 'Erro interno ao criar compra'
    });
  }
}

async function listPurchases(req, res) {
  try {
    const purchases = await prisma.purchase.findMany({
      where: {
        userId: req.user.id,
        deletedAt: null
      },
      include: {
        payments: {
          orderBy: {
            paymentDate: 'desc'
          }
        },
        supplier: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedPurchases = purchases.map(formatPurchase);

    const openPurchases = formattedPurchases.filter(
      purchase => !purchase.isPaid
    );

    const paidPurchases = formattedPurchases.filter(
      purchase => purchase.isPaid
    );

    const summary = {
      totalAmount: formattedPurchases.reduce(
        (sum, purchase) => sum + Number(purchase.totalAmount),
        0
      ),
      totalPaid: formattedPurchases.reduce(
        (sum, purchase) => sum + purchase.totalPaid,
        0
      ),
      totalOpen: formattedPurchases.reduce(
        (sum, purchase) => sum + purchase.totalOpen,
        0
      ),
      openCount: openPurchases.length,
      paidCount: paidPurchases.length,
      totalCount: formattedPurchases.length
    };

    return res.json({
      summary,
      purchases: openPurchases,
      paidPurchases
    });
  } catch (error) {
    console.error('Erro ao listar compras:', error);

    return res.status(500).json({
      message: 'Erro interno ao listar compras'
    });
  }
}

async function getPurchase(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        userId: req.user.id,
        deletedAt: null
      },
      include: {
        payments: {
          orderBy: {
            paymentDate: 'desc'
          }
        },
        supplier: true
      }
    });

    if (!purchase) {
      return res.status(404).json({
        message: 'Compra não encontrada'
      });
    }

    return res.json(formatPurchase(purchase));
  } catch (error) {
    console.error('Erro ao buscar compra:', error);

    return res.status(500).json({
      message: 'Erro interno ao buscar compra'
    });
  }
}

async function updatePurchase(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        userId: req.user.id,
        deletedAt: null
      },
      include: {
        payments: true
      }
    });

    if (!purchase) {
      return res.status(404).json({
        message: 'Compra não encontrada'
      });
    }

    const data = {};

    if (req.body.notes !== undefined) {
      if (
        req.body.notes !== null &&
        typeof req.body.notes !== 'string'
      ) {
        return res.status(400).json({
          message: 'Observação inválida'
        });
      }

      const notes = req.body.notes?.trim() || null;

      if (notes && notes.length > 500) {
        return res.status(400).json({
          message: 'A observação deve possuir no máximo 500 caracteres'
        });
      }

      data.notes = notes;
    }

    if (req.body.supplierId !== undefined) {
      const supplierValidation = await validateSupplier(
        req.body.supplierId,
        req.user.id
      );

      if (!supplierValidation.valid) {
        return res.status(400).json({
          message: supplierValidation.message
        });
      }

      data.supplierId = supplierValidation.supplierId;
    }

    if (req.body.description !== undefined) {
      const validation = validateDescription(req.body.description);

      if (!validation.valid) {
        return res.status(400).json({
          message: validation.message
        });
      }

      data.description = validation.value;
    }

    if (req.body.totalAmount !== undefined) {
      const validation = validateAmount(req.body.totalAmount);

      if (!validation.valid) {
        return res.status(400).json({
          message: validation.message
        });
      }

      const totalPaid = purchase.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );

      if (validation.amount < totalPaid) {
        return res.status(400).json({
          message: `O valor total não pode ser menor que o valor já pago (R$ ${totalPaid.toFixed(2)})`
        });
      }

      data.totalAmount = validation.amount;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: 'Nenhuma alteração foi informada'
      });
    }

    const updated = await prisma.purchase.update({
      where: { id },
      data,
      include: {
        payments: true, 
        supplier: true 
      }
    });

    return res.json(formatPurchase(updated));
  } catch (error) {
    console.error('Erro ao atualizar compra:', error);

    return res.status(500).json({
      message: 'Erro interno ao atualizar compra'
    });
  }
}

async function deletePurchase(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        userId: req.user.id,
        deletedAt: null
      }
    });

    if (!purchase) {
      return res.status(404).json({
        message: 'Compra não encontrada'
      });
    }

    await prisma.purchase.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return res.json({
      message: 'Compra arquivada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir compra:', error);

    return res.status(500).json({
      message: 'Erro interno ao excluir compra'
    });
  }
}

module.exports = {
  createPurchase,
  listPurchases,
  getPurchase,
  updatePurchase,
  deletePurchase,
  validateAmount
};