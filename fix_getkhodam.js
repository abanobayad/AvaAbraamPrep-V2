const fs = require('fs');
let c = fs.readFileSync('src/app/actions/db.ts', 'utf8');

c = c.replace(/const result = await prisma\.khadem\.findMany\(\{\s*where: \{ role: \{ not: 'student' \} \}\s*\}\);\s*const safeResult = result\.map\(\(k: any\) => \{\s*const \{ password, \.\.\.rest \} = k;\s*return rest;\s*\}\);/,
  `const result = await prisma.khadem.findMany({
      where: { role: { not: 'student' } },
      select: { id: true, name: true, username: true, role: true, createdAt: true }
    });
    const safeResult = result;`);
fs.writeFileSync('src/app/actions/db.ts', c);
