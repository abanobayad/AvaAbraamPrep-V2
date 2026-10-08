const fs = require('fs');

let c1 = fs.readFileSync('src/app/actions/db.ts', 'utf8');
c1 = c1.replace(/\[\\\\u0600-\\\\u06FF\\\\s\]/g, '[\\u0600-\\u06FF\\s]');
c1 = c1.replace(/\.test\(data\.name\)/g, '.test(data.name.trim())');
fs.writeFileSync('src/app/actions/db.ts', c1);

let c2 = fs.readFileSync('src/components/features/AddStudentForm.tsx', 'utf8');
c2 = c2.replace(/\.test\(formData\.name\)/g, '.test(formData.name.trim())');
fs.writeFileSync('src/components/features/AddStudentForm.tsx', c2);
