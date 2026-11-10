
const prisma = require('../prismaClient');

const MAX_NAME_LENGTH = 150;
const MAX_PHONE_LENGTH = 30;
const MAX_EMAIL_LENGTH = 150;
const MAX_DOCUMENT_LENGTH = 30;
const MAX_NOTES_LENGTH = 500;

function validateSupplierData(body, partial = false) {
  const data = {};

  if (!partial || body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return {
        valid: false,
        message: 'O nome do fornecedor é obrigatório'
      };
    }

    const name = body.name.trim();

    if (name.length > MAX_NAME_LENGTH) {
      return {
        valid: false,
        message: `O nome deve possuir no máximo ${MAX_NAME_LENGTH} caracteres`
      };
    }

    data.name = name;
  }

  const optionalFields = [
    { field: 'phone', max: MAX_PHONE_LENGTH, label: 'Telefone' },
    { field: 'email', max: MAX_EMAIL_LENGTH, label: 'E-mail' },
    { field: 'document', max: MAX_DOCUMENT_LENGTH, label: 'Documento' },
    { field: 'notes', max: MAX_NOTES_LENGTH, label: 'Observação' }
  ];

  for (const item of optionalFields) {
    const value = body[item.field];

    if (partial && value === undefined) {
      continue;
    }

    if (value !== undefined && value !== null && typeof value !== 'string') {
      return {
        valid: false,
        message: `${item.label} inválido`
      };
    }

    const normalized = value?.trim() || null;

    if (normalized && normalized.length > item.max) {
      return {
        valid: false,
        message: `${item.label} deve possuir no máximo ${item.max} caracteres`
      };
    }

    if (item.field === 'email' && normalized) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(normalized)) {
        return {
          valid: false,
          message: 'E-mail inválido'
        };
      }
    }

    data[item.field] = normalized;
  }

  return { valid: true, data };
}

async function createSupplier(req, res) {
  try {
    const validation = validateSupplierData(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message
      });
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...validation.data,
        userId: req.user.id
      }
    });

    return res.status(201).json(supplier);
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);

    return res.status(500).json({
      message: 'Erro interno ao criar fornecedor'
    });
  }
}

async function listSuppliers(req, res) {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        userId: req.user.id,
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            purchases: {
              where: {
                deletedAt: null
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
      message: 'Erro interno ao listar fornecedores'
    });
  }
}

async function getSupplier(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        userId: req.user.id,
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            purchases: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({
        message: 'Fornecedor não encontrado'
      });
    }

    return res.json(supplier);
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);

    return res.status(500).json({
      message: 'Erro interno ao buscar fornecedor'
    });
  }
}

async function updateSupplier(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        userId: req.user.id,
        deletedAt: null
      }
    });

    if (!supplier) {
      return res.status(404).json({
        message: 'Fornecedor não encontrado'
      });
    }

    const validation = validateSupplierData(req.body, true);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message
      });
    }

    if (Object.keys(validation.data).length === 0) {
      return res.status(400).json({
        message: 'Nenhuma alteração foi informada'
      });
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: validation.data
    });

    return res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);

    return res.status(500).json({
      message: 'Erro interno ao atualizar fornecedor'
    });
  }
}

async function deleteSupplier(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        userId: req.user.id,
        deletedAt: null
      }
    });

    if (!supplier) {
      return res.status(404).json({
        message: 'Fornecedor não encontrado'
      });
    }

    await prisma.supplier.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });

    return res.json({
      message: 'Fornecedor arquivado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);

    return res.status(500).json({
      message: 'Erro interno ao excluir fornecedor'
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