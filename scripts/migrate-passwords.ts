import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function migratePasswords() {
  console.log('Starting password migration...');
  
  const khodamToMigrate = await prisma.khadem.findMany({
    where: {
      NOT: {
        password: {
          startsWith: 'pbkdf2$'
        }
      }
    }
  });

  console.log(`Found ${khodamToMigrate.length} khodam with legacy plaintext passwords.`);

  for (const khadem of khodamToMigrate) {
    console.log(`Migrating password for user: ${khadem.username}...`);
    const newHash = await hashPassword(khadem.password);
    
    await prisma.khadem.update({
      where: { id: khadem.id },
      data: { password: newHash }
    });
    console.log(`Successfully migrated user: ${khadem.username}`);
  }

  console.log('Migration complete!');
}

migratePasswords()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
