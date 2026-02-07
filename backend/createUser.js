const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const username = 'kaname';        // ← seu login
  const password = 'qaaz123';       // ← TROQUE ISSO depois

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      username,
      password: hash
    }
  });

  console.log('✅ Usuário criado com sucesso!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
