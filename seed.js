const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.khadem.create({
    data: {
      name: 'Mina Maher',
      username: 'magayby',
      password: 'Minamaher123',
      role: 'superadmin'
    }
  });
  console.log('Superadmin created!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
