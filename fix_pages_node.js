const fs = require('fs');

function fix(filePath, search, replace) {
  let c = fs.readFileSync(filePath, 'utf8');
  c = c.replace(search, replace);
  fs.writeFileSync(filePath, c);
}

fix('src/app/attendance/page.tsx', 
  /const rawStudents = await getStudents\(\);\s*students = JSON\.parse\(JSON\.stringify\(rawStudents\)\);/, 
  'const res = await getStudents(); if (res.success) students = res.data;'
);

fix('src/app/efteqad/page.tsx', 
  /const rawStudents = await getEfteqadStudents\(\);\s*students = JSON\.parse\(JSON\.stringify\(rawStudents\)\);/, 
  'const res = await getEfteqadStudents(); if (res.success) students = res.data;'
);

fix('src/app/manage-khodam/page.tsx', 
  /const rawKhodam = await getKhodam\(\);\s*khodam = JSON\.parse\(JSON\.stringify\(rawKhodam\)\);/, 
  'const res = await getKhodam(); if (res.success) khodam = res.data;'
);

fix('src/app/media/page.tsx', 
  /const rawMedia = await getMedia\(\);\s*media = JSON\.parse\(JSON\.stringify\(rawMedia\)\);/, 
  'const res = await getMedia(); if (res.success) media = res.data;'
);

fix('src/app/points-leaderboard/page.tsx', 
  /const rawStudents = await getLeaderboard\(\);\s*students = JSON\.parse\(JSON\.stringify\(rawStudents\)\);/, 
  'const res = await getLeaderboard(); if (res.success) students = res.data;'
);

fix('src/app/student-portal/page.tsx', 
  /const rawStudent = await getStudentById\(session\.id\);\s*student = JSON\.parse\(JSON\.stringify\(rawStudent\)\);/, 
  'const resStudent = await getStudentById(session.id); if (resStudent.success) student = resStudent.data;'
);

fix('src/app/student-portal/page.tsx', 
  /const rawAll = await getLeaderboard\(\);\s*allStudents = JSON\.parse\(JSON\.stringify\(rawAll\)\);/, 
  'const resAll = await getLeaderboard(); if (resAll.success) allStudents = resAll.data;'
);
