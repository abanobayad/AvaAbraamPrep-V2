const fs = require('fs');
let c = fs.readFileSync('src/components/features/MediaClient.tsx', 'utf8');
c = c.replace(/const newMedia = await addMedia\(formData\);/, `const res = await addMedia(formData);
      if (!res || res.error || res.success === false) {
        throw new Error(res?.error || 'Failed to add media');
      }
      const newMedia = res.data || res;`);
fs.writeFileSync('src/components/features/MediaClient.tsx', c);
