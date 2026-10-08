const fs = require('fs');
let c = fs.readFileSync('src/components/features/EfteqadHistoryDialog.tsx', 'utf8');
c = c.replace(/const history = await getEfteqadHistory\(studentId\)\s+setLogs\(history\)/, `const res = await getEfteqadHistory(studentId);
        if (res && res.success) {
          setLogs(res.data);
        }`);
fs.writeFileSync('src/components/features/EfteqadHistoryDialog.tsx', c);
