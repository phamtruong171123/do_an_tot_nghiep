const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  const email = 'admin@example.com';
  const password = 'Admin@12345';
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {username:'admin1', email, passwordHash: hash, role: 'ADMIN', status: 'ACTIVE' }
  });

  console.log('Seeded admin:', email, '/', password);
  await prisma.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
