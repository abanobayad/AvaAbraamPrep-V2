const fs = require('fs');
let c = fs.readFileSync('src/app/actions/auth.ts', 'utf8');
c = c.replace(/if \(target\.role === "superadmin"\) return \{ success: false, error: "لا يمكن تغيير كلمة سر الـ Superadmin بهذه الطريقة" \};/, 
  'if (target.role === "superadmin") return { success: false, error: "لا يمكن تغيير كلمة سر الـ Superadmin بهذه الطريقة" };\n    if (target.role === "student" as any) return { success: false, error: "غير مصرح بتغيير كلمة سر طالب" };');
fs.writeFileSync('src/app/actions/auth.ts', c);
