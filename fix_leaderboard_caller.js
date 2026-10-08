const fs = require('fs');
let c = fs.readFileSync('src/components/features/PointsLeaderboardClient.tsx', 'utf8');
c = c.replace(/awardPoints\(studentId, points, reason, currentUser\)/, 'awardPoints(studentId, points, reason)');
fs.writeFileSync('src/components/features/PointsLeaderboardClient.tsx', c);
