const fs = require('fs');

let c = fs.readFileSync('src/services/auth.ts', 'utf8');
if (!c.includes('type: "student" | "staff"')) {
  c = c.replace(/export interface UserSession \{/, 'export interface UserSession {\n  type: "student" | "staff";');
  fs.writeFileSync('src/services/auth.ts', c);
}

let auth = fs.readFileSync('src/app/actions/auth.ts', 'utf8');
if (!auth.includes('type: "staff"')) {
  auth = auth.replace(/const token = await createToken\(\{[\s\S]*?id: user\.id,[\s\S]*?username: user\.username,[\s\S]*?role: user\.role as any,[\s\S]*?\}\)/, (match) => {
    return match.replace(/role: user\.role as any,/, 'role: user.role as any,\n    type: "staff",');
  });
  
  auth = auth.replace(/const token = await createToken\(\{[\s\S]*?id: student\.id,[\s\S]*?username: student\.name,[\s\S]*?role: 'student',[\s\S]*?\}\)/, (match) => {
    return match.replace(/role: 'student',/, 'role: "student",\n    type: "student",');
  });
  fs.writeFileSync('src/app/actions/auth.ts', auth);
}

let authz = fs.readFileSync('src/lib/authz.ts', 'utf8');
if (!authz.includes('session.type')) {
  authz = authz.replace(/if \(roles\.length > 0 && !roles\.includes\(session\.role\)\) \{/, 
    `if (roles.length > 0 && !roles.includes(session.role)) {
    throw new Error("Forbidden");
  }
  
  // Explicitly reject student tokens from staff-only role requirements, just as an extra check
  if (!roles.includes("student") && session.type === "student") {`);
  fs.writeFileSync('src/lib/authz.ts', authz);
}
