const fs = require('fs');
let file = 'src/app/actions/db.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/return await prisma\.student\.findMany\(([\s\S]*?)\);/g, 'const result = await prisma.student.findMany($1);\n  return JSON.parse(JSON.stringify(result));');
c = c.replace(/return await prisma\.student\.findUnique\(([\s\S]*?)\);/g, 'const result = await prisma.student.findUnique($1);\n  return JSON.parse(JSON.stringify(result));');
c = c.replace(/return await prisma\.khadem\.findMany\(([\s\S]*?)\);/g, 'const result = await prisma.khadem.findMany($1);\n  return JSON.parse(JSON.stringify(result));');
c = c.replace(/return await prisma\.transaction\.findMany\(([\s\S]*?)\);/g, 'const result = await prisma.transaction.findMany($1);\n  return JSON.parse(JSON.stringify(result));');
c = c.replace(/return await prisma\.media\.findMany\(([\s\S]*?)\);/g, 'const result = await prisma.media.findMany($1);\n  return JSON.parse(JSON.stringify(result));');
c = c.replace(/return await prisma\.efteqadLog\.findMany\(([\s\S]*?)\);/g, 'const result = await prisma.efteqadLog.findMany($1);\n  return JSON.parse(JSON.stringify(result));');

fs.writeFileSync(file, c);
