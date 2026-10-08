const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.khadem.findMany({
    where: {
      NOT: {
        password: {
          startsWith: 'pbkdf2$'
        }
      }
    },
    select: {
      username: true
    }
  });

  console.log('Count:', users.length);
  console.log('Usernames:', users.map(u => u.username));
}

main().catch(console.error).finally(() => prisma.$disconnect());
