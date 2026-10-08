const fs = require('fs');
let c = fs.readFileSync('src/app/actions/db.ts', 'utf8');
const lastIndex = c.lastIndexOf('}');
if (lastIndex !== -1) {
  c = c.substring(0, lastIndex) + c.substring(lastIndex + 1);
}
fs.writeFileSync('src/app/actions/db.ts', c);

