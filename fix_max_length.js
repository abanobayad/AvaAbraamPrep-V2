const fs = require('fs');

let c = fs.readFileSync('src/components/features/PointsLeaderboardClient.tsx', 'utf8');
c = c.replace(/onChange=\{e => setDeductReason\(e\.target\.value\)\} \n\s*placeholder="/,
  'onChange={e => setDeductReason(e.target.value)} maxLength={88}\n              placeholder="');

c = c.replace(/onChange=\{e => setCustomReason\(e\.target\.value\)\} placeholder="/,
  'onChange={e => setCustomReason(e.target.value)} maxLength={100} placeholder="');

fs.writeFileSync('src/components/features/PointsLeaderboardClient.tsx', c);
