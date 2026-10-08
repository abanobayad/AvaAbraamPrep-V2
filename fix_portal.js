const fs = require('fs');

let c = fs.readFileSync('src/app/student-portal/page.tsx', 'utf8');
c = c.replace(/import \{ getStudentById, getStudents \} from/g, 'import { getStudentById, getLeaderboard } from');
c = c.replace(/const rawAll = await getStudents\(\);/g, 'const rawAll = await getLeaderboard();');
fs.writeFileSync('src/app/student-portal/page.tsx', c);

let c2 = fs.readFileSync('src/app/points-leaderboard/page.tsx', 'utf8');
c2 = c2.replace(/getStudents/g, 'getLeaderboard');
fs.writeFileSync('src/app/points-leaderboard/page.tsx', c2);
