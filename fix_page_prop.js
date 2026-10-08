const fs = require('fs');
let c = fs.readFileSync('src/app/points-leaderboard/page.tsx', 'utf8');
c = c.replace(/currentUser=\{session\.username\}/, '');
fs.writeFileSync('src/app/points-leaderboard/page.tsx', c);
