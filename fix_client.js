const fs = require('fs');
let s = fs.readFileSync('src/components/features/StudentList.tsx', 'utf8');
s = s.replace(/import \{ EFTEQAD_ENABLED \} from "@\/lib\/features";\n"use client"/, '"use client"\nimport { EFTEQAD_ENABLED } from "@/lib/features";');
fs.writeFileSync('src/components/features/StudentList.tsx', s);
