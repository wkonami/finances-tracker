const prisma = require('../prismaClient');

async function createDebt(req, res) {
  const { debtorName, totalAmount, notes } = req.body;
  if (!debtorName || totalAmount == null) return res.status(400).json({ message: 'Missing' });

  const debt = await prisma.debt.create({
    data: {
      debtorName,
      totalAmount: parseFloat(totalAmount),
      notes
    }
  });
  res.json(debt);
}

async function listDebts(req, res) {
  const debts = await prisma.debt.findMany({
    include: {
      payments: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // calculate totals
  const response = debts.map(d => {
    const paid = d.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    return {
      ...d,
      totalPaid: paid,
      totalOpen: parseFloat(d.totalAmount) - paid
    };
  });

  // summary
  const totalOpen = response.reduce((s, d) => s + d.totalOpen, 0);
  const totalPaid = response.reduce((s, d) => s + d.totalPaid, 0);

  res.json({ summary: { totalOpen, totalPaid, count: response.length }, debts: response });
}

async function getDebt(req, res) {
  const id = parseInt(req.params.id);
  const debt = await prisma.debt.findUnique({ where: { id }, include: { payments: true } });
  if (!debt) return res.status(404).json({ message: 'Not found' });

  const totalPaid = debt.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  res.json({ ...debt, totalPaid, totalOpen: parseFloat(debt.totalAmount) - totalPaid });
}

async function updateDebt(req, res) {
  const id = parseInt(req.params.id);
  const data = req.body; // allow editing totalAmount and notes
  const updated = await prisma.debt.update({
    where: { id },
    data: {
      totalAmount: data.totalAmount !== undefined ? parseFloat(data.totalAmount) : undefined,
      notes: data.notes
    }
  });
  res.json(updated);
}

module.exports = { createDebt, listDebts, getDebt, updateDebt };