const fs = require('fs');
let c = fs.readFileSync('src/components/features/ExportDataCard.tsx', 'utf8');
c = c.replace(/const students = await getStudents\(selectedClass\)\s+if \(students\.length === 0\) \{/, `const res = await getStudents(selectedClass);
        if (!res.success) throw new Error(res.error);
        const students = res.data;
        if (students.length === 0) {`);
fs.writeFileSync('src/components/features/ExportDataCard.tsx', c);
