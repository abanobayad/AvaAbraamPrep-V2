const fs = require('fs');
let c = fs.readFileSync('src/components/features/TransactionHistoryDialog.tsx', 'utf8');
c = c.replace(/<span className=\{`font-bold \$\{tx\.pointsChanged > 0 \? 'text-success' : 'text-destructive'\}`\}>/, `<span dir="ltr" className={\`font-bold \${tx.pointsChanged > 0 ? 'text-success' : 'text-destructive'}\`}>`);
fs.writeFileSync('src/components/features/TransactionHistoryDialog.tsx', c);
