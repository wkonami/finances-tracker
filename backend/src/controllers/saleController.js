const prisma = require('../prismaClient');

const MAX_DEBTOR_NAME_LENGTH = 100;
const MAX_NOTES_LENGTH = 500;
const MAX_SALE_AMOUNT = 99999999.99;

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

  if (amount > MAX_SALE_AMOUNT) {
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
  if (typeof name !== 'string' || !name.trim()) {
    return {
      valid: false,
      message: 'Nome é obrigatório'
    };
  }

  const trimmedName = name.trim();

  if (trimmedName.length > MAX_DEBTOR_NAME_LENGTH) {
    return {
      valid: false,
      message: `O nome deve possuir no máximo ${MAX_DEBTOR_NAME_LENGTH} caracteres`
    };
  }

  return {
    valid: true,
    value: trimmedName
  };
}

function calculateSaleStatus(sale) {
  const totalPaid = sale.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const totalOpen = Math.max(
    Number(sale.totalAmount) - totalPaid,
    0
  );

  const isPaid = totalOpen <= 0;
  const isClosed = sale.delivered && isPaid;

  return {
    ...sale,
    totalPaid,
    totalOpen,
    isPaid,
    isClosed
  };
}

async function createSale(req, res) {
  try {
    const {
      debtorName,
      totalAmount,
      notes
    } = req.body;

    const nameValidation = validateDebtorName(debtorName);

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

    const amountValidation = validateAmount(totalAmount);

    if (!amountValidation.valid) {
      return res.status(400).json({
        message: amountValidation.message
      });
    }

    const notesValidation = validateNotes(notes);

    if (!notesValidation.valid) {
      return res.status(400).json({
        message: notesValidation.message
      });
    }

    const sale = await prisma.sale.create({
      data: {
        debtorName: nameValidation.value,
        totalAmount: amountValidation.amount,
        notes: notesValidation.value,
        userId: req.user.id
      }
    });

    return res.status(201).json(sale);

  } catch (error) {
    console.error({
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id
    });

    return res.status(500).json({
      message: 'Erro interno ao cadastrar venda'
    });
  }
}

async function listSales(req, res) {
  try {
    const sales = await prisma.sale.findMany({
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

    const formattedSales = sales.map(calculateSaleStatus);

    const openSales = formattedSales.filter(
      sale => !sale.isClosed
    );

    const closedSales = formattedSales.filter(
      sale => sale.isClosed
    );

    const totalOpen = formattedSales.reduce(
      (sum, sale) => sum + sale.totalOpen,
      0
    );

    const totalPaid = formattedSales.reduce(
      (sum, sale) => sum + sale.totalPaid,
      0
    );

    const pendingDeliveries = formattedSales.filter(
      sale => !sale.delivered
    ).length;

    const awaitingPayment = formattedSales.filter(
      sale => !sale.isPaid
    ).length;

    return res.json({
      summary: {
        totalOpen,
        totalPaid,
        pendingDeliveries,
        awaitingPayment,
        openCount: openSales.length,
        closedCount: closedSales.length
      },

      // Mantidos temporariamente para compatibilidade com o frontend.
      debts: openSales,
      closedDebts: closedSales
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
      message: 'Erro interno ao listar vendas'
    });
  }
}

async function getSale(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id,
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

    return res.json(calculateSaleStatus(sale));

  } catch (error) {
    console.error({
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id
    });

    return res.status(500).json({
      message: 'Erro interno ao buscar venda'
    });
  }
}

async function updateSale(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id,
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

    const {
      debtorName,
      totalAmount,
      notes
    } = req.body;

    const data = {};

    if (debtorName !== undefined) {
      const nameValidation = validateDebtorName(debtorName);

      if (!nameValidation.valid) {
        return res.status(400).json({
          message: nameValidation.message
        });
      }

      data.debtorName = nameValidation.value;
    }

    if (totalAmount !== undefined) {
      const amountValidation = validateAmount(totalAmount);

      if (!amountValidation.valid) {
        return res.status(400).json({
          message: amountValidation.message
        });
      }

      const totalPaid = sale.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );

      if (amountValidation.amount < totalPaid) {
        return res.status(400).json({
          message: `O valor total não pode ser menor que o valor já pago (R$ ${totalPaid.toFixed(2)})`
        });
      }

      data.totalAmount = amountValidation.amount;
    }

    if (notes !== undefined) {
      const notesValidation = validateNotes(notes);

      if (!notesValidation.valid) {
        return res.status(400).json({
          message: notesValidation.message
        });
      }

      data.notes = notesValidation.value;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: 'Nenhuma alteração foi informada'
      });
    }

    const updatedSale = await prisma.sale.update({
      where: {
        id
      },
      data
    });

    return res.json(updatedSale);

  } catch (error) {
    console.error({
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id
    });

    return res.status(500).json({
      message: 'Erro interno ao atualizar venda'
    });
  }
}

async function deleteSale(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID da venda inválido'
      });
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id,
        userId: req.user.id,
        deletedAt: null
      }
    });

    if (!sale) {
      return res.status(404).json({
        message: 'Venda não encontrada'
      });
    }

    await prisma.sale.update({
      where: {
        id
      },
      data: {
        deletedAt: new Date()
      }
    });

    return res.json({
      message: 'Venda arquivada'
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
      message: 'Erro interno ao arquivar venda'
    });
  }
}

async function markAsDelivered(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID da venda inválido'
      });
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id,
        userId: req.user.id,
        deletedAt: null
      }
    });

    if (!sale) {
      return res.status(404).json({
        message: 'Venda não encontrada'
      });
    }

    if (sale.delivered) {
      return res.status(400).json({
        message: 'Esta venda já foi marcada como entregue.'
      });
    }

    const updatedSale = await prisma.sale.update({
      where: {
        id
      },
      data: {
        delivered: true
      }
    });

    return res.json(updatedSale);

  } catch (error) {
    console.error({
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id
    });

    return res.status(500).json({
      message: 'Erro interno ao marcar venda como entregue'
    });
  }
}

async function markAsNotDelivered(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID da venda inválido'
      });
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id,
        userId: req.user.id,
        deletedAt: null
      }
    });

    if (!sale) {
      return res.status(404).json({
        message: 'Venda não encontrada'
      });
    }

    if (!sale.delivered) {
      return res.status(400).json({
        message: 'Esta venda não está marcada como entregue.'
      });
    }

    const updatedSale = await prisma.sale.update({
      where: {
        id
      },
      data: {
        delivered: false
      }
    });

    return res.json(updatedSale);

  } catch (error) {
    console.error({
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id
    });

    return res.status(500).json({
      message: 'Erro interno ao desmarcar venda como entregue'
    });
  }
}

const MAX_SYNC_BATCH_SIZE = 50;

function isValidExternalId(value) {
  if (typeof value !== 'string') {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function syncSales(req, res) {
  try {
    const { sales } = req.body;

    // Validação do lote
    if (!Array.isArray(sales) || sales.length === 0) {
      return res.status(400).json({
        message: 'Informe pelo menos uma venda para sincronizar'
      });
    }

    if (sales.length > MAX_SYNC_BATCH_SIZE) {
      return res.status(400).json({
        message: `O lote não pode ultrapassar ${MAX_SYNC_BATCH_SIZE} vendas`
      });
    }

    const results = [];

    const summary = {
      total: sales.length,
      created: 0,
      alreadySynced: 0,
      failed: 0
    };

    // Processa cada venda individualmente
    for (const saleData of sales) {
      const externalId = saleData?.externalId;

      try {
        // Validação do identificador
        if (!isValidExternalId(externalId)) {
          throw new Error('Identificador externo inválido');
        }

        const normalizedExternalId = externalId.toLowerCase();

        // Verifica se a venda já foi sincronizada
        const existingSale = await prisma.sale.findUnique({
          where: {
            externalId: normalizedExternalId
          },
          select: {
            id: true,
            userId: true
          }
        });

        if (existingSale) {
          // Não permite reutilizar UUID de outro usuário
          if (existingSale.userId !== req.user.id) {
            throw new Error('Identificador já utilizado');
          }

          summary.alreadySynced++;

          results.push({
            externalId,
            status: 'already_synced',
            saleId: existingSale.id
          });

          continue;
        }

        // Validação dos dados
        const nameValidation = validateDebtorName(
          saleData.debtorName
        );

        if (!nameValidation.valid) {
          throw new Error(nameValidation.message);
        }

        const amountValidation = validateAmount(
          saleData.totalAmount
        );

        if (!amountValidation.valid) {
          throw new Error(amountValidation.message);
        }

        const notesValidation = validateNotes(
          saleData.notes
        );

        if (!notesValidation.valid) {
          throw new Error(notesValidation.message);
        }

        // Cadastro da venda
        const createdSale = await prisma.sale.create({
          data: {
            externalId: normalizedExternalId,
            debtorName: nameValidation.value,
            totalAmount: amountValidation.amount,
            notes: notesValidation.value,

            // Nunca utilizar userId recebido do Android
            userId: req.user.id
          },
          select: {
            id: true,
            externalId: true
          }
        });

        summary.created++;

        results.push({
          externalId: createdSale.externalId,
          status: 'created',
          saleId: createdSale.id
        });

      } catch (error) {
        // Trata concorrência: outra requisição pode ter
        // sincronizado o mesmo UUID simultaneamente.
        if (
          error.code === 'P2002' &&
          isValidExternalId(externalId)
        ) {
          const existingSale = await prisma.sale.findUnique({
            where: {
              externalId: externalId.toLowerCase()
            },
            select: {
              id: true,
              userId: true
            }
          });

          if (
            existingSale &&
            existingSale.userId === req.user.id
          ) {
            summary.alreadySynced++;

            results.push({
              externalId,
              status: 'already_synced',
              saleId: existingSale.id
            });

            continue;
          }
        }

        summary.failed++;

        results.push({
          externalId: externalId || null,
          status: 'error',
          message: error.message || 'Erro ao sincronizar venda'
        });
      }
    }

    return res.status(200).json({
      message: 'Sincronização processada',
      summary,
      results
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
      message: 'Erro interno ao sincronizar vendas'
    });
  }
}


module.exports = {
  createSale,
  listSales,
  getSale,
  updateSale,
  deleteSale,
  markAsDelivered,
  markAsNotDelivered,
  syncSales,

  // Compatibilidade temporária com as rotas antigas.
  createDebt: createSale,
  listDebts: listSales,
  getDebt: getSale,
  updateDebt: updateSale,
  deleteDebt: deleteSale
};