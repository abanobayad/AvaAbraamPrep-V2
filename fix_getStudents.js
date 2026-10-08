const fs = require('fs');
let content = fs.readFileSync('src/app/actions/db.ts', 'utf8');
content = content.replace(
  /await requireRole\("superadmin", "admin", "student"\);\s*const prisma = getPrisma\(getRequestContext\(\)\.env as any\);\s*const result = await prisma\.student\.findMany\(\{/g,
  `await requireRole("superadmin", "admin");
    const prisma = getPrisma(getRequestContext().env as any);
    const result = await prisma.student.findMany({`
);
fs.writeFileSync('src/app/actions/db.ts', content);
