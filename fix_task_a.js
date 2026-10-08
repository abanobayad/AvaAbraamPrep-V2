const fs = require('fs');

function hideEfteqad(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  if (!c.includes('EFTEQAD_ENABLED')) {
    c = c.replace(/import {.*?} from "lucide-react";/, (match) => match + '\nimport { EFTEQAD_ENABLED } from "@/lib/features";');
    c = c.replace(/<Link href="\/efteqad"[\s\S]*?<\/Link>/, (match) => '{EFTEQAD_ENABLED && (' + match + ')}');
    fs.writeFileSync(filePath, c);
  }
}

hideEfteqad('src/app/admin-dashboard/page.tsx');
hideEfteqad('src/app/superadmin-dashboard/page.tsx');

let s = fs.readFileSync('src/components/features/StudentList.tsx', 'utf8');
if (!s.includes('EFTEQAD_ENABLED')) {
  s = 'import { EFTEQAD_ENABLED } from "@/lib/features";\n' + s;
  s = s.replace(/<EfteqadHistoryDialog studentId=\{student.id\} studentName=\{student.name\} \/>/, '{EFTEQAD_ENABLED && <EfteqadHistoryDialog studentId={student.id} studentName={student.name} />}');
  fs.writeFileSync('src/components/features/StudentList.tsx', s);
}

let ep = fs.readFileSync('src/app/efteqad/page.tsx', 'utf8');
if (!ep.includes('EFTEQAD_ENABLED')) {
  ep = ep.replace(/export default async function EfteqadPage\(\) \{/, 'import { EFTEQAD_ENABLED } from "@/lib/features";\n\nexport default async function EfteqadPage() {\n  if (!EFTEQAD_ENABLED) redirect("/");');
  fs.writeFileSync('src/app/efteqad/page.tsx', ep);
}

let db = fs.readFileSync('src/app/actions/db.ts', 'utf8');
if (!db.includes('EFTEQAD_ENABLED')) {
  db = db.replace(/import { revalidatePath } from "next\/cache";/, 'import { revalidatePath } from "next/cache";\nimport { EFTEQAD_ENABLED } from "@/lib/features";');
  
  db = db.replace(/export async function getEfteqadStudents\(\) \{[\s\S]*?try \{[\s\S]*?await requireRole\("superadmin", "admin"\);/, (match) => match + '\n    if (!EFTEQAD_ENABLED) return { success: false, error: "الميزة غير متاحة حالياً" };');
  db = db.replace(/export async function getEfteqadLog\(studentId: string\) \{[\s\S]*?try \{[\s\S]*?await requireRole\("superadmin", "admin"\);/, (match) => match + '\n    if (!EFTEQAD_ENABLED) return { success: false, error: "الميزة غير متاحة حالياً" };');
  db = db.replace(/export async function addEfteqadLog\(studentId: string, notes: string \| undefined\) \{[\s\S]*?try \{[\s\S]*?await requireRole\("superadmin", "admin"\);/, (match) => match + '\n    if (!EFTEQAD_ENABLED) return { success: false, error: "الميزة غير متاحة حالياً" };');

  fs.writeFileSync('src/app/actions/db.ts', db);
}
