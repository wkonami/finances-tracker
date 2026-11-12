const prisma = require('../prismaClient');
const normalizeSupplierName = require('../utils/normalizeSupplierName');

function validateSupplierData(body) {
  const name = normalizeSupplierName(body.name);

  const phone = body.phone?.trim() || null;
  const email = body.email?.trim() || null;
  const document = body.document?.trim() || null;
  const notes = body.notes?.trim() || null;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Informe um e-mail válido.');
  }

  if (phone && phone.length > 30) {
    throw new Error('O telefone deve ter no máximo 30 caracteres.');
  }

  if (email && email.length > 150) {
    throw new Error('O e-mail deve ter no máximo 150 caracteres.');
  }

  if (document && document.length > 30) {
    throw new Error('O documento deve ter no máximo 30 caracteres.');
  }

  if (notes && notes.length > 500) {
    throw new Error('As observações devem ter no máximo 500 caracteres.');
  }

  return {
    name,
    phone,
    email,
    document,
    notes
  };
}

function handleSupplierError(res, error) {
  if (error.code === 'P2002') {
    return res.status(409).json({
      message: 'Já existe um fornecedor com esse nome.'
    });
  }

  if (error.message) {
    return res.status(400).json({
      message: error.message
    });
  }

  console.error('Erro ao processar fornecedor:', error);

  return res.status(500).json({
    message: 'Erro interno ao processar fornecedor.'
  });
}

async function createSupplier(req, res) {
  try {
    const data = validateSupplierData(req.body);

    const supplier = await prisma.supplier.create({
      data
    });

    return res.status(201).json(supplier);
  } catch (error) {
    return handleSupplierError(res, error);
  }
}

async function listSuppliers(req, res) {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            purchases: {
              where: {
                deletedAt: null,
                userId: req.user.id
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.json(suppliers);
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);

    return res.status(500).json({
      message: 'Erro ao listar fornecedores.'
    });
  }
}

async function getSupplier(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID de fornecedor inválido.'
      });
    }

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            purchases: {
              where: {
                deletedAt: null,
                userId: req.user.id
              }
            }
          }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({
        message: 'Fornecedor não encontrado.'
      });
    }

    return res.json(supplier);
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);

    return res.status(500).json({
      message: 'Erro ao buscar fornecedor.'
    });
  }
}

async function updateSupplier(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID de fornecedor inválido.'
      });
    }

    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!existingSupplier) {
      return res.status(404).json({
        message: 'Fornecedor não encontrado.'
      });
    }

    const data = validateSupplierData(req.body);

    const supplier = await prisma.supplier.update({
      where: {
        id
      },
      data
    });

    return res.json(supplier);
  } catch (error) {
    return handleSupplierError(res, error);
  }
}

async function deleteSupplier(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID de fornecedor inválido.'
      });
    }

    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!existingSupplier) {
      return res.status(404).json({
        message: 'Fornecedor não encontrado.'
      });
    }

    const supplier = await prisma.supplier.update({
      where: {
        id
      },
      data: {
        deletedAt: new Date()
      }
    });

    return res.json({
      message: 'Fornecedor arquivado com sucesso.',
      supplier
    });
  } catch (error) {
    console.error('Erro ao arquivar fornecedor:', error);

    return res.status(500).json({
      message: 'Erro ao arquivar fornecedor.'
    });
  }
}

module.exports = {
  createSupplier,
  listSuppliers,
  getSupplier,
  updateSupplier,
  deleteSupplier
};