const fs = require('fs');
let c = fs.readFileSync('src/app/media/page.tsx', 'utf8');

c = c.replace(/const rawMedia = await getMedia\(\);\s+mediaList = JSON\.parse\(JSON\.stringify\(rawMedia\)\);/, 
  'const res = await getMedia(); if (res.success) mediaList = res.data;');

fs.writeFileSync('src/app/media/page.tsx', c);
