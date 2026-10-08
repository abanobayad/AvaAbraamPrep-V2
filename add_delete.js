const fs = require('fs');
let c = fs.readFileSync('src/app/actions/db.ts', 'utf8');

const newDelete = `
export async function deleteStudent(studentId: string) {
  try {
    await requireRole("superadmin", "admin");
    const env = getRequestContext().env as any;
    const db = env.DB;

    const delTransactions = db.prepare('DELETE FROM "Transaction" WHERE studentId = ?').bind(studentId);
    const delAttendance = db.prepare('DELETE FROM "Attendance" WHERE studentId = ?').bind(studentId);
    const delEfteqad = db.prepare('DELETE FROM "EfteqadLog" WHERE studentId = ?').bind(studentId);
    const delStudent = db.prepare('DELETE FROM "Student" WHERE id = ?').bind(studentId);

    await db.batch([delTransactions, delAttendance, delEfteqad, delStudent]);

    return { success: true, data: null };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى." };
  }
}
`;

c += newDelete;
fs.writeFileSync('src/app/actions/db.ts', c);
