const fs = require('fs');
let content = fs.readFileSync('src/app/actions/db.ts', 'utf8');
content = content.replace(/} catch \(err: any\) {/g, '} catch (err: any) {\n    console.error("Action Error:", err);');
fs.writeFileSync('src/app/actions/db.ts', content);
