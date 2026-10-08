const fs = require('fs');
let c = fs.readFileSync('src/components/features/AttendanceClient.tsx', 'utf8');
c = c.replace(/await saveAttendance\(new Date\(date\), records, khademName\)/, `const res = await saveAttendance(new Date(date), records, khademName);
      if (!res || res.error || res.success === false) {
        throw new Error(res?.error || 'Failed to save attendance');
      }`);
fs.writeFileSync('src/components/features/AttendanceClient.tsx', c);
