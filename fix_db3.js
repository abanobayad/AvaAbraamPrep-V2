const fs = require('fs');
let c = fs.readFileSync('src/app/actions/db.ts', 'utf8');
c = c.replace(/}\n}$/, '}');
fs.writeFileSync('src/app/actions/db.ts', c);

