const fs = require('fs');
let c = fs.readFileSync('src/components/features/TransactionHistoryDialog.tsx', 'utf8');
c = c.replace(/getStudentHistory\(student\.id\)\.then\(txs => \{/, `getStudentHistory(student.id).then(res => {
        const txs = res.success ? res.data : [];`);
fs.writeFileSync('src/components/features/TransactionHistoryDialog.tsx', c);
