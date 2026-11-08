const prisma = require('../prismaClient');

const TIME_ZONE = 'America/Campo_Grande';
const DEFAULT_MONTHS = 6;
const MAX_MONTHS = 24;

function getDateParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, Number(part.value)])
  );
}

function getUtcDateFromLocal(year, monthIndex, day) {
  const utcGuess = Date.UTC(year, monthIndex, day);
  const parts = getDateParts(new Date(utcGuess));

  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  const offset = representedAsUtc - utcGuess;

  return new Date(utcGuess - offset);
}

function getMonthKey(date) {
  const parts = getDateParts(date);

  return `${parts.year}-${String(parts.month).padStart(2, '0')}`;
}

function getMonthLabel(year, monthIndex) {
  const date = new Date(Date.UTC(year, monthIndex, 15));

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    month: 'short',
    year: '2-digit'
  }).format(date).replace('.', '');
}

function toCents(value) {
  return Math.round(Number(value) * 100);
}

async function getFinancialFlow(req, res) {
  try {
    const months = Number(req.query.months ?? DEFAULT_MONTHS);

    if (
      !Number.isInteger(months) ||
      months < 1 ||
      months > MAX_MONTHS
    ) {
      return res.status(400).json({
        message: `O período deve ser um número inteiro entre 1 e ${MAX_MONTHS} meses`
      });
    }

    const currentParts = getDateParts(new Date());

    const currentYear = currentParts.year;
    const currentMonthIndex = currentParts.month - 1;

    const firstMonth = new Date(
      Date.UTC(currentYear, currentMonthIndex - months + 1, 1)
    );

    const startYear = firstMonth.getUTCFullYear();
    const startMonthIndex = firstMonth.getUTCMonth();

    const nextMonth = new Date(
      Date.UTC(currentYear, currentMonthIndex + 1, 1)
    );

    const startDate = getUtcDateFromLocal(
      startYear,
      startMonthIndex,
      1
    );

    const endDate = getUtcDateFromLocal(
      nextMonth.getUTCFullYear(),
      nextMonth.getUTCMonth(),
      1
    );

    const [salesPayments, purchasePayments] = await Promise.all([
      prisma.payment.findMany({
        where: {
          paymentDate: {
            gte: startDate,
            lt: endDate
          },
          debt: {
            is: {
              userId: req.user.id,
              deletedAt: null
            }
          }
        },
        select: {
          amount: true,
          paymentDate: true
        }
      }),

      prisma.purchasePayment.findMany({
        where: {
          paymentDate: {
            gte: startDate,
            lt: endDate
          },
          purchase: {
            is: {
              userId: req.user.id,
              deletedAt: null
            }
          }
        },
        select: {
          amount: true,
          paymentDate: true
        }
      })
    ]);

    const monthlyData = [];

    for (let index = 0; index < months; index++) {
      const monthDate = new Date(
        Date.UTC(startYear, startMonthIndex + index, 1)
      );

      const year = monthDate.getUTCFullYear();
      const monthIndex = monthDate.getUTCMonth();

      monthlyData.push({
        month: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
        label: getMonthLabel(year, monthIndex),
        salesCents: 0,
        purchasesCents: 0
      });
    }

    const monthlyMap = new Map(
      monthlyData.map(item => [item.month, item])
    );

    for (const payment of salesPayments) {
      const month = monthlyMap.get(
        getMonthKey(payment.paymentDate)
      );

      if (month) {
        month.salesCents += toCents(payment.amount);
      }
    }

    for (const payment of purchasePayments) {
      const month = monthlyMap.get(
        getMonthKey(payment.paymentDate)
      );

      if (month) {
        month.purchasesCents += toCents(payment.amount);
      }
    }

    const data = monthlyData.map(item => ({
      month: item.month,
      label: item.label,
      sales: item.salesCents / 100,
      purchases: item.purchasesCents / 100
    }));

    const totals = data.reduce(
      (result, item) => ({
        sales: result.sales + item.sales,
        purchases: result.purchases + item.purchases
      }),
      {
        sales: 0,
        purchases: 0
      }
    );

    return res.json({
      months,
      data,
      totals: {
        sales: Number(totals.sales.toFixed(2)),
        purchases: Number(totals.purchases.toFixed(2)),
        balance: Number(
          (totals.sales - totals.purchases).toFixed(2)
        )
      }
    });
  } catch (error) {
    console.error('Erro ao consultar fluxo financeiro:', error);

    return res.status(500).json({
      message: 'Erro interno ao consultar fluxo financeiro'
    });
  }
}

module.exports = {
  getFinancialFlow
};