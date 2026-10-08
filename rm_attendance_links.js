const fs = require('fs');

function removeAttendanceLinks(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  // Remove the <Link href="/attendance" ... block
  c = c.replace(/<Link href="\/attendance"[\s\S]*?<\/Link>/g, '');
  fs.writeFileSync(filePath, c);
}

removeAttendanceLinks('src/app/admin-dashboard/page.tsx');
removeAttendanceLinks('src/app/superadmin-dashboard/page.tsx');
