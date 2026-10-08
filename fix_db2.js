const fs = require('fs');
let c = fs.readFileSync('src/app/actions/db.ts', 'utf8');
c = c.replace(/}\n}\n\nexport async function getStudentHistory/, '}\n\nexport async function getStudentHistory');
fs.writeFileSync('src/app/actions/db.ts', c);

