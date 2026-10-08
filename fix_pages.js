const fs = require('fs');

function replaceGet(filePath, funcName) {
  let c = fs.readFileSync(filePath, 'utf8');
  c = c.replace(new RegExp(\const (raw[a-zA-Z]+) = await \\\\(\\\);\\\\s+[a-zA-Z]+ = JSON.parse\\\(JSON.stringify\\\(.*?\\\)\\\);\), (match, varName) => {
    return \const res = await \();
      if (res.success) {
        \ = res.data;
      }\;
  });
  // handle simpler cases if present
  fs.writeFileSync(filePath, c);
}

replaceGet('src/app/attendance/page.tsx', 'getStudents');
replaceGet('src/app/efteqad/page.tsx', 'getEfteqadStudents');
replaceGet('src/app/manage-khodam/page.tsx', 'getKhodam');
replaceGet('src/app/media/page.tsx', 'getMedia');
replaceGet('src/app/points-leaderboard/page.tsx', 'getLeaderboard');

// specific for student-portal
let sp = fs.readFileSync('src/app/student-portal/page.tsx', 'utf8');
sp = sp.replace(/const rawStudent = await getStudentById\\(session.id\\);\\s+student = JSON.parse\\(JSON.stringify\\(rawStudent\\)\\);/, 'const resStudent = await getStudentById(session.id); if (resStudent.success) student = resStudent.data;');
sp = sp.replace(/const rawAll = await getLeaderboard\\(\\);\\s+allStudents = JSON.parse\\(JSON.stringify\\(rawAll\\)\\);/, 'const resAll = await getLeaderboard(); if (resAll.success) allStudents = resAll.data;');
fs.writeFileSync('src/app/student-portal/page.tsx', sp);

