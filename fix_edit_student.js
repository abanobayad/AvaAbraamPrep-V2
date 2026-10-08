const fs = require('fs');
let c = fs.readFileSync('src/components/features/EditStudentDialog.tsx', 'utf8');
c = c.replace(/const updated = await updateStudent\(student\.id, formData\);/, `const res = await updateStudent(student.id, formData);
        if (!res || res.error || res.success === false) {
          throw new Error(res?.error || 'Failed to update student');
        }
        const updated = res.data || res;`);
fs.writeFileSync('src/components/features/EditStudentDialog.tsx', c);
