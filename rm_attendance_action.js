const fs = require('fs');
let c = fs.readFileSync('src/app/actions/db.ts', 'utf8');

c = c.replace(/export async function saveAttendance[\s\S]*?(?=export async function getEfteqadStudents)/, '');

fs.writeFileSync('src/app/actions/db.ts', c);
