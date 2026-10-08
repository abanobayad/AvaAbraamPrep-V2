const { execSync } = require('child_process');

try {
  execSync(`npx wrangler d1 execute attendance-db --remote --command "UPDATE \\"Transaction\\" SET timestamp = REPLACE(timestamp, 'Z', '+00:00') WHERE timestamp LIKE '%Z'"`, { encoding: 'utf8' });
  execSync(`npx wrangler d1 execute attendance-db --remote --command "UPDATE \\"Student\\" SET updatedAt = REPLACE(updatedAt, 'Z', '+00:00') WHERE updatedAt LIKE '%Z'"`, { encoding: 'utf8' });
  console.log("Fixed existing rows");
} catch (e) {
  console.error(e.stdout || e.stderr || e.message);
}
