const fs = require('fs');
let c = fs.readFileSync('src/components/features/StudentList.tsx', 'utf8');
c = c.replace(/const data = await getStudents\(\)\s+setStudents\(data\)/, `const res = await getStudents();
      if (res.success) {
        setStudents(res.data);
      }`);
fs.writeFileSync('src/components/features/StudentList.tsx', c);
