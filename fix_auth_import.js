const fs = require('fs');
let c = fs.readFileSync('src/app/actions/auth.ts', 'utf8');
c = c.replace(/import \{ requireRole \} from "@\/app\/actions\/db";[^\n]*/, 'import { requireRole } from "@/lib/authz";');
fs.writeFileSync('src/app/actions/auth.ts', c);
