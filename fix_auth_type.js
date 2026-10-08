const fs = require('fs');
let c = fs.readFileSync('src/services/auth.ts', 'utf8');
c = c.replace(/ctx\?\.env\?\.JWT_SECRET/g, '(ctx?.env as any)?.JWT_SECRET');
c = c.replace(/ctx\.env\.JWT_SECRET/g, '(ctx.env as any).JWT_SECRET');
fs.writeFileSync('src/services/auth.ts', c);
