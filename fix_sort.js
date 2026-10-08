const fs = require('fs');

let c = fs.readFileSync('src/app/student-portal/page.tsx', 'utf8');
c = c.replace(/const sortedStudents = \[\.\.\.allStudents\]\.sort\(\(a: any, b: any\) => b\.totalPoints - a\.totalPoints\);/,
  `const sortedStudents = [...allStudents].sort((a: any, b: any) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return a.name.localeCompare(b.name, 'ar');
  });`);
fs.writeFileSync('src/app/student-portal/page.tsx', c);

let c2 = fs.readFileSync('src/components/features/PointsLeaderboardClient.tsx', 'utf8');
c2 = c2.replace(/const sortedStudents = \[\.\.\.students\]\.sort\(\(a, b\) => \(b\.totalPoints \|\| 0\) - \(a\.totalPoints \|\| 0\)\);/,
  `const sortedStudents = [...students].sort((a, b) => {
    const ptsB = b.totalPoints || 0;
    const ptsA = a.totalPoints || 0;
    if (ptsB !== ptsA) return ptsB - ptsA;
    return a.name.localeCompare(b.name, 'ar');
  });`);
fs.writeFileSync('src/components/features/PointsLeaderboardClient.tsx', c2);

