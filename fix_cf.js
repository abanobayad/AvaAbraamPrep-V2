const fs = require("fs");
function fixAction(file) {
  let c = fs.readFileSync(file, "utf8");
  c = c.replace(/import \{ prisma \} from "\@\/lib\/prisma"/g, `import { getPrisma } from "@/lib/prisma"`);
  if (!c.includes("@cloudflare/next-on-pages")) {
    c = c.replace(/import \{ getPrisma \} from "\@\/lib\/prisma";?\r?\n/g, `import { getPrisma } from "@/lib/prisma";\nimport { getRequestContext } from "@cloudflare/next-on-pages";\n`);
  }
  c = c.replace(/export async function (\w+)\(([^)]*)\) \{/g, `export async function \$1(\$2) {\n  const prisma = getPrisma(getRequestContext().env as any);\n`);
  fs.writeFileSync(file, c);
}
fixAction("src/app/actions/auth.ts");
fixAction("src/app/actions/db.ts");

