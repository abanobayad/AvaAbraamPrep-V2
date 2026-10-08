const fs = require('fs');
let c = fs.readFileSync('src/app/actions/auth.ts', 'utf8');
c = c.replace(/target\.role === "student" as any/, 'target.role === "student"');
fs.writeFileSync('src/app/actions/auth.ts', c);
