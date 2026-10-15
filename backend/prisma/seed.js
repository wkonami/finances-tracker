const {
  PrismaClient
} = require('@prisma/client');

const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {

  console.log('Iniciando seed...');

  if (process.env.NODE_ENV === 'production') {

    throw new Error(
      'Seed bloqueado: NODE_ENV=production'
    );

  }

  await prisma.payment.deleteMany();

  await prisma.debt.deleteMany();

  await prisma.user.deleteMany();

  const passwordHash =
    await bcrypt.hash('123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: passwordHash,
      role: 'ADMIN'
    }
  });

  const user1 = await prisma.user.create({
    data: {
      username: 'usuario',
      password: passwordHash,
      role: 'USER'
    }
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'teste',
      password: passwordHash,
      role: 'USER'
    }
  });

  console.log('Usuários criados');

  const debts = [];

  debts.push(
    await prisma.debt.create({
      data: {
        debtorName: 'João Silva',
        totalAmount: 150.00,
        notes: 'Colar',
        userId: admin.id
      }
    })
  );

  const debt2 =
    await prisma.debt.create({
      data: {
        debtorName: 'Maria Oliveira',
        totalAmount: 500.00,
        notes: 'Pulseira\nPagamento via PIX',
        userId: admin.id
      }
    });

  debts.push(debt2);

  await prisma.payment.create({
    data: {
      amount: 200.00,
      paymentDate: new Date(),
      note: 'Primeiro pagamento',
      debtId: debt2.id
    }
  });

  const debt3 =
    await prisma.debt.create({
      data: {
        debtorName: 'Carlos Souza',
        totalAmount: 1000.00,
        notes: 'Brinco',
        userId: user1.id
      }
    });

  debts.push(debt3);

  await prisma.payment.createMany({
    data: [
      {
        amount: 250.00,
        paymentDate: new Date(),
        note: 'Pagamento inicial',
        debtId: debt3.id
      },
      {
        amount: 150.00,
        paymentDate: new Date(),
        note: 'Segundo pagamento',
        debtId: debt3.id
      }
    ]
  });

  const debt4 =
    await prisma.debt.create({
      data: {
        debtorName: 'Ana Costa',
        totalAmount: 300.00,
        notes: 'Enfeite de Cabelo',
        userId: user1.id
      }
    });

  debts.push(debt4);

  await prisma.payment.create({
    data: {
      amount: 300.00,
      paymentDate: new Date(),
      note: 'Pagamento integral',
      debtId: debt4.id
    }
  });

  const debt5 =
    await prisma.debt.create({
      data: {
        debtorName: 'Pedro Santos',
        totalAmount: 750.00,
        notes: 'Colar\nEntregue ao cliente',
        userId: user1.id
      }
    });

  debts.push(debt5);

  await prisma.payment.create({
    data: {
      amount: 300.00,
      paymentDate: new Date(),
      note: 'Entrada',
      debtId: debt5.id
    }
  });

  const debt6 =
    await prisma.debt.create({
      data: {
        debtorName: 'Fernanda Lima',
        totalAmount: 450.00,
        notes: 'Pulseira',
        userId: admin.id,
        delivered: true
      }
    });

  debts.push(debt6);

  await prisma.payment.create({
    data: {
      amount: 450.00,
      paymentDate: new Date(),
      note: 'Pagamento integral',
      debtId: debt6.id
    }
  });

  debts.push(
    await prisma.debt.create({
      data: {
        debtorName: 'Lucas Martins',
        totalAmount: 220.00,
        notes: 'Brinco',
        userId: user2.id
      }
    })
  );

  const debt8 =
    await prisma.debt.create({
      data: {
        debtorName: 'Juliana Alves',
        totalAmount: 850.00,
        notes: 'Colar\nPulseira',
        userId: user2.id
      }
    });

  debts.push(debt8);

  await prisma.payment.createMany({
    data: [
      {
        amount: 100.00,
        paymentDate: new Date(),
        note: 'Entrada',
        debtId: debt8.id
      },
      {
        amount: 200.00,
        paymentDate: new Date(),
        note: 'Segundo pagamento',
        debtId: debt8.id
      }
    ]
  });

  const debt9 =
    await prisma.debt.create({
      data: {
        debtorName: 'Rafael Mendes',
        totalAmount: 600.00,
        notes: 'Enfeite de Cabelo',
        userId: user2.id
      }
    });

  debts.push(debt9);

  await prisma.payment.create({
    data: {
      amount: 600.00,
      paymentDate: new Date(),
      note: 'Quitação',
      debtId: debt9.id
    }
  });

  const debt10 =
    await prisma.debt.create({
      data: {
        debtorName: 'Camila Rodrigues',
        totalAmount: 1200.00,
        notes: 'Colar\nPulseira\nPedido entregue',
        userId: admin.id,
        delivered: true
      }
    });

  debts.push(debt10);

  await prisma.payment.createMany({
    data: [
      {
        amount: 500.00,
        paymentDate: new Date(),
        note: 'Entrada',
        debtId: debt10.id
      },
      {
        amount: 400.00,
        paymentDate: new Date(),
        note: 'Segundo pagamento',
        debtId: debt10.id
      },
      {
        amount: 300.00,
        paymentDate: new Date(),
        note: 'Quitação',
        debtId: debt10.id
      }
    ]
  });

  debts.push(
    await prisma.debt.create({
      data: {
        debtorName: 'Bruno Ferreira',
        totalAmount: 350.00,
        notes: 'Brinco',
        userId: user1.id
      }
    })
  );

  const debt12 =
    await prisma.debt.create({
      data: {
        debtorName: 'Patrícia Gomes',
        totalAmount: 950.00,
        notes: 'Colar\nEnfeite de Cabelo',
        userId: user2.id
      }
    });

  debts.push(debt12);

  await prisma.payment.create({
    data: {
      amount: 400.00,
      paymentDate: new Date(),
      note: 'Pagamento parcial',
      debtId: debt12.id
    }
  });

  console.log(
    `${debts.length} dívidas criadas`
  );

  console.log('Usuários:');

  console.log('admin / 123456');

  console.log('usuario / 123456');

  console.log('teste / 123456');

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((error) => {

    console.error(
      'Erro durante o seed:',
      error
    );

    process.exit(1);

  })
  .finally(async () => {

    await prisma.$disconnect();

  });