const fs = require('fs');
let code = fs.readFileSync('src/app/actions/db.ts', 'utf8');
code = code.replace(/import \{ prisma \} from [\"\']@\/lib\/prisma[\"\'];?/, '');
const imports = "export const runtime = 'edge';\nimport { getPrisma } from '@/lib/prisma';\nimport { getRequestContext } from '@cloudflare/next-on-pages';\n";
code = imports + code;
const funcRegex = /(export async function \w+\([^)]*\) \{)/g;
code = code.replace(funcRegex, "$1\n  const prisma = getPrisma(getRequestContext().env as any);");
fs.writeFileSync('src/app/actions/db.ts', code);
