"use server";

import { getPrisma } from "@/lib/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { revalidatePath } from "next/cache";
import { EFTEQAD_ENABLED } from "@/lib/features";
import { requireRole } from "@/lib/authz";
import { hashPassword } from "@/lib/password";

const GENERIC_ERROR = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";

export async function getStudents(studentClass?: string) {
  try {
    await requireRole("superadmin", "admin");
    const prisma = getPrisma(getRequestContext().env as any);
    const result = await prisma.student.findMany({
      where: studentClass && studentClass !== "الكل" ? { studentClass } : undefined,
      orderBy: { totalPoints: 'desc' }
    });
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function getStudentById(id: string) {
  try {
    const session = await requireRole("superadmin", "admin", "student");
    if (session.role === "student" && session.id !== id) {
      throw new Error("Forbidden");
    }
    const prisma = getPrisma(getRequestContext().env as any);
    const result = await prisma.student.findUnique({ where: { id } });
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function addStudent(data: { name: string; studentClass: string; phone?: string; address?: string; notes?: string }) {
  try {
    await requireRole("superadmin", "admin");
    const prisma = getPrisma(getRequestContext().env as any);

    if (!/^[\u0600-\u06FF\s]+$/.test(data.name.trim())) {
      return { success: false, error: "الاسم يجب أن يحتوي على حروف عربية فقط" };
    }

    let code = "";
    let isUnique = false;
    while (!isUnique) {
      code = Math.floor(10000 + Math.random() * 90000).toString();
      const existing = await prisma.student.findUnique({ where: { studentCode: code } });
      if (!existing) isUnique = true;
    }

    const student = await prisma.student.create({
      data: {
        name: data.name,
        studentCode: code,
        studentClass: data.studentClass,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        totalPoints: 0,
      }
    });

    return { success: true, data: JSON.parse(JSON.stringify(student)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function getKhodam() {
  try {
    await requireRole("superadmin");
    const prisma = getPrisma(getRequestContext().env as any);
    const result = await prisma.khadem.findMany({
      where: { role: { not: 'student' } },
      select: { id: true, name: true, username: true, role: true, createdAt: true }
    });
    const safeResult = result;
    return { success: true, data: JSON.parse(JSON.stringify(safeResult)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function addKhadem(data: any) {
  try {
    await requireRole("superadmin");
    const prisma = getPrisma(getRequestContext().env as any);
    const hashedPassword = await hashPassword(data.password);
    const khadem = await prisma.khadem.create({
      data: {
        name: data.name,
        username: data.username,
        password: hashedPassword,
        role: data.role,
      }
    });
    
    const { password: _, ...safeData } = khadem;
    return { success: true, data: JSON.parse(JSON.stringify(safeData)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    if (err.code === "P2002") return { success: false, error: "اسم المستخدم مسجل بالفعل. يرجى اختيار اسم آخر." };
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function deleteKhadem(id: string) {
  try {
    await requireRole("superadmin");
    const prisma = getPrisma(getRequestContext().env as any);
    await prisma.khadem.delete({ where: { id } });
    return { success: true, data: null };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function awardPoints(studentId: string, points: number, actionName: string) {
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
}

export async function getStudentHistory(studentId: string) {
  try {
    const session = await requireRole("superadmin", "admin", "student");
    if (session.role === "student" && session.id !== studentId) {
      throw new Error("Forbidden");
    }
    const prisma = getPrisma(getRequestContext().env as any);
    const result = await prisma.transaction.findMany({
      where: { studentId },
      orderBy: { timestamp: 'desc' }
    });
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function updateStudent(id: string, data: { name: string; studentClass: string; phone?: string; address?: string; notes?: string }) {
  try {
    await requireRole("superadmin", "admin");
    const prisma = getPrisma(getRequestContext().env as any);
    if (!/^[\u0600-\u06FF\s]+$/.test(data.name.trim())) {
      return { success: false, error: "الاسم يجب أن يحتوي على حروف عربية فقط" };
    }
    const student = await prisma.student.update({
      where: { id },
      data: { name: data.name, studentClass: data.studentClass, phone: data.phone, address: data.address, notes: data.notes }
    });
    
    return { success: true, data: JSON.parse(JSON.stringify(student)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function getMedia() {
  try {
    await requireRole("superadmin", "admin", "student");
    const prisma = getPrisma(getRequestContext().env as any);
    const result = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function addMedia(data: { title: string; url: string; type: string }) {
  try {
    await requireRole("superadmin", "admin");
    const prisma = getPrisma(getRequestContext().env as any);
    const media = await prisma.media.create({
      data: { title: data.title, url: data.url, type: data.type }
    });
    return { success: true, data: JSON.parse(JSON.stringify(media)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function getEfteqadStudents() {
  try {
    await requireRole("superadmin", "admin");
    if (!EFTEQAD_ENABLED) return { success: false, error: "الميزة غير متاحة حالياً" };
    const prisma = getPrisma(getRequestContext().env as any);
    const result = await prisma.student.findMany({
      where: { needsEfteqad: true },
      orderBy: { name: 'asc' }
    });
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function logEfteqad(studentId: string, khademName: string, notes?: string) {
  try {
    await requireRole("superadmin", "admin");
    const prisma = getPrisma(getRequestContext().env as any);
    const log = await prisma.$transaction(async (tx) => {
      const createdLog = await tx.efteqadLog.create({
        data: { studentId, khademName, notes: notes || null }
      });
      await tx.student.update({
        where: { id: studentId },
        data: { needsEfteqad: false }
      });
      return createdLog;
    });
    return { success: true, data: JSON.parse(JSON.stringify(log)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function getEfteqadHistory(studentId: string) {
  try {
    await requireRole("superadmin", "admin");
    const prisma = getPrisma(getRequestContext().env as any);
    const result = await prisma.efteqadLog.findMany({
      where: { studentId },
      orderBy: { date: 'desc' }
    });
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function getLeaderboard() {
  try {
    await requireRole("superadmin", "admin", "student");
    const prisma = getPrisma(getRequestContext().env as any);
    const result = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        totalPoints: true,
        studentClass: true
      },
      orderBy: { totalPoints: 'desc' }
    });
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function deleteStudent(studentId: string) {
  try {
    await requireRole("superadmin", "admin");
    const env = getRequestContext().env as any;
    const db = env.DB;

    const studentCheck = await db.prepare('SELECT id FROM "Student" WHERE id = ?').bind(studentId).first();
    if (!studentCheck) {
      return { success: false, error: "الطالب غير موجود" };
    }

    const delTransactions = db.prepare('DELETE FROM "Transaction" WHERE studentId = ?').bind(studentId);
    const delAttendance = db.prepare('DELETE FROM "Attendance" WHERE studentId = ?').bind(studentId);
    const delEfteqad = db.prepare('DELETE FROM "EfteqadLog" WHERE studentId = ?').bind(studentId);
    const delStudent = db.prepare('DELETE FROM "Student" WHERE id = ?').bind(studentId);

    await db.batch([delTransactions, delAttendance, delEfteqad, delStudent]);

    try {
      revalidatePath("/students-list");
      revalidatePath("/points-leaderboard");
      revalidatePath("/student-portal");
    } catch(e) {}

    return { success: true, data: null };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى." };
  }
}

