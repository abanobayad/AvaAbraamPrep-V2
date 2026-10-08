const fs = require('fs');
let c = fs.readFileSync('src/components/features/ManageKhodamClient.tsx', 'utf8');
c = c.replace(/await deleteKhadem\(id\);/, `const res = await deleteKhadem(id);
      if (!res || res.error || res.success === false) {
        throw new Error(res?.error || 'Failed to delete khadem');
      }`);
fs.writeFileSync('src/components/features/ManageKhodamClient.tsx', c);
