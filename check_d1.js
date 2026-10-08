const { execSync } = require('child_process');

try {
  const out1 = execSync(`npx wrangler d1 execute attendance-db --remote --command "SELECT timestamp, typeof(timestamp) FROM \\"Transaction\\" ORDER BY rowid LIMIT 5"`, { encoding: 'utf8' });
  console.log("Transaction timestamp:", out1);
} catch (e) {
  console.error(e.stdout || e.stderr || e.message);
}

try {
  const out2 = execSync(`npx wrangler d1 execute attendance-db --remote --command "SELECT updatedAt, typeof(updatedAt) FROM \\"Student\\" ORDER BY rowid LIMIT 5"`, { encoding: 'utf8' });
  console.log("Student updatedAt:", out2);
} catch (e) {
  console.error(e.stdout || e.stderr || e.message);
}
