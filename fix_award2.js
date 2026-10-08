const fs = require('fs');
let c = fs.readFileSync('src/app/actions/db.ts', 'utf8');

// Also add revalidatePath import at the top
if (!c.includes('revalidatePath')) {
  c = c.replace(/import { getRequestContext } from "@cloudflare\/next-on-pages";/, 'import { getRequestContext } from "@cloudflare/next-on-pages";\nimport { revalidatePath } from "next/cache";');
}

const newAward = `export async function awardPoints(studentId: string, points: number, actionName: string) {
  try {
    const session = await requireRole("superadmin", "admin");
    const addedBy = session.username;
    
    if (!Number.isInteger(points) || points < -100 || points > 100 || points === 0) {
      return { success: false, error: "قيمة غير صحيحة" };
    }
    if (typeof actionName !== "string" || actionName.trim().length === 0 || actionName.length > 100) {
      return { success: false, error: "اسم فعل غير صحيح" };
    }

    const env = getRequestContext().env as any;
    const db = env.DB;

    const studentCheck = await db.prepare('SELECT id, name, studentClass FROM "Student" WHERE id = ?').bind(studentId).first();
    if (!studentCheck) {
      return { success: false, error: "الطالب غير موجود" };
    }

    const txId = 'c' + crypto.randomUUID().replace(/-/g, '').substring(0, 24);
    const timestamp = new Date().toISOString().replace('Z', '+00:00');

    const insertTx = db.prepare('INSERT INTO "Transaction" (id, studentId, actionName, pointsChanged, addedBy, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(txId, studentId, actionName, points, addedBy, timestamp);
    
    const updateStudent = db.prepare('UPDATE "Student" SET totalPoints = totalPoints + ?, updatedAt = ? WHERE id = ? RETURNING totalPoints')
      .bind(points, timestamp, studentId);
      
    const batchResults = await db.batch([insertTx, updateStudent]);
    const updatedTotal = batchResults[1].results[0].totalPoints;

    try {
      revalidatePath("/students-list");
      revalidatePath("/points-leaderboard");
      revalidatePath("/student-portal");
    } catch(e) {}

    return { 
      success: true, 
      data: { 
        id: studentCheck.id, 
        name: studentCheck.name, 
        studentClass: studentCheck.studentClass, 
        totalPoints: updatedTotal 
      } 
    };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى." };
  }
}`;

c = c.replace(/export async function awardPoints\(.*?} catch \(err: any\) \{[^}]*\}[^}]*\}/s, newAward);
fs.writeFileSync('src/app/actions/db.ts', c);
