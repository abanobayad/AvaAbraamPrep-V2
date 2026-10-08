const fs = require('fs');
let c = fs.readFileSync('src/components/features/EfteqadClient.tsx', 'utf8');
c = c.replace(/await logEfteqad\(studentId, khademName, notes\)/, `const res = await logEfteqad(studentId, khademName, notes);
      if (!res || res.error || res.success === false) {
        throw new Error(res?.error || 'Failed to log efteqad');
      }`);
fs.writeFileSync('src/components/features/EfteqadClient.tsx', c);
