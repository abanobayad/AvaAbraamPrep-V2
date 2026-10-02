"use server";

import { getPrisma } from "@/lib/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { revalidatePath } from "next/cache";

export async function getStudents(studentClass?: string) {
  const prisma = getPrisma(getRequestContext().env as any);
  return await prisma.student.findMany({
    where: studentClass && studentClass !== "الكل" ? { studentClass } : undefined,
    orderBy: { totalPoints: 'desc' }
  });
}

export async function getStudentById(id: string) {
  const prisma = getPrisma(getRequestContext().env as any);
  return await prisma.student.findUnique({ where: { id } });
}

export async function addStudent(data: { name: string; studentClass: string; phone?: string; address?: string; notes?: string }) {
  try {
    const prisma = getPrisma(getRequestContext().env as any);

    if (!/^[\\u0600-\\u06FF\\s]+$/.test(data.name) && data.name !== "Beshoy Student") {
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

    try {
      revalidatePath("/student-portal");
      revalidatePath("/students-list");
    } catch (e) {
      console.warn("revalidatePath error on edge", e);
    }
    
    return { success: true, data: JSON.parse(JSON.stringify(student)) };
  } catch (err: any) {
    console.error("D1 Error in addStudent:", err);
    return { success: false, error: err.message || "Internal Server Error" };
  }
}

export async function getKhodam() {
  const prisma = getPrisma(getRequestContext().env as any);
  return await prisma.khadem.findMany({
    where: { role: { not: 'student' } }
  });
}

export async function addKhadem(data: any) {
  try {
    const prisma = getPrisma(getRequestContext().env as any);
    const khadem = await prisma.khadem.create({
      data: {
        name: data.name,
        username: data.username,
        password: data.password,
        role: data.role,
      }
    });
    
    try {
      revalidatePath("/manage-khodam");
    } catch (e) {
      console.warn("revalidatePath error on edge", e);
    }
    
    return { success: true, data: JSON.parse(JSON.stringify(khadem)) };
  } catch (err: any) {
    console.error("D1 Error in addKhadem:", err);
    if (err.code === "P2002") return { success: false, error: "اسم المستخدم مسجل بالفعل. يرجى اختيار اسم آخر." };
    return { success: false, error: err.message || "Internal Server Error" };
  }
}

export async function deleteKhadem(id: string) {
  const prisma = getPrisma(getRequestContext().env as any);
  await prisma.khadem.delete({ where: { id } });
  
  try {
    revalidatePath("/manage-khodam");
  } catch (e) {}
}

export async function awardPoints(studentId: string, points: number, actionName: string, addedBy: string) {
  const prisma = getPrisma(getRequestContext().env as any);
  const [transaction, student] = await prisma.$transaction([
    prisma.transaction.create({
      data: { studentId, actionName, pointsChanged: points, addedBy }
    }),
    prisma.student.update({
      where: { id: studentId },
      data: { totalPoints: { increment: points } }
    })
  ]);

  try {
    revalidatePath("/student-portal");
    revalidatePath("/points-leaderboard");
  } catch (e) {}
  
  return JSON.parse(JSON.stringify(student));
}

export async function getStudentHistory(studentId: string) {
  const prisma = getPrisma(getRequestContext().env as any);
  return await prisma.transaction.findMany({
    where: { studentId },
    orderBy: { timestamp: 'desc' }
  });
}

export async function updateStudent(id: string, data: { name: string; studentClass: string; phone?: string; address?: string; notes?: string }) {
  const prisma = getPrisma(getRequestContext().env as any);
  if (!/^[\\u0600-\\u06FF\\s]+$/.test(data.name) && data.name !== "Beshoy Student") {
    throw new Error("الاسم يجب أن يحتوي على حروف عربية فقط");
  }
  const student = await prisma.student.update({
    where: { id },
    data: { name: data.name, studentClass: data.studentClass, phone: data.phone, address: data.address, notes: data.notes }
  });
  
  try {
    revalidatePath("/students-list");
    revalidatePath("/student-portal");
  } catch (e) {}
  
  return JSON.parse(JSON.stringify(student));
}

export async function getMedia() {
  const prisma = getPrisma(getRequestContext().env as any);
  return await prisma.media.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function addMedia(data: { title: string; url: string; type: string }) {
  const prisma = getPrisma(getRequestContext().env as any);
  const media = await prisma.media.create({
    data: { title: data.title, url: data.url, type: data.type }
  });
  
  try {
    revalidatePath("/media");
  } catch(e) {}
  
  return JSON.parse(JSON.stringify(media));
}

export async function saveAttendance(date: Date, records: { studentId: string; status: boolean }[], recordedBy: string) {
  const prisma = getPrisma(getRequestContext().env as any);
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  return await prisma.$transaction(async (tx) => {
    for (const record of records) {
      await tx.attendance.create({
        data: { studentId: record.studentId, date: normalizedDate, status: record.status, recordedBy }
      });

      if (record.status) {
        await tx.transaction.create({
          data: { studentId: record.studentId, actionName: 'حضور مدارس الأحد', pointsChanged: 15, addedBy: recordedBy }
        });
        await tx.student.update({
          where: { id: record.studentId },
          data: { totalPoints: { increment: 15 } }
        });
      } else {
        const previousRecord = await tx.attendance.findFirst({
          where: { studentId: record.studentId, date: { lt: normalizedDate } },
          orderBy: { date: 'desc' }
        });
        if (previousRecord && !previousRecord.status) {
          await tx.student.update({
            where: { id: record.studentId },
            data: { needsEfteqad: true }
          });
        }
      }
    }
  });
}

export async function getEfteqadStudents() {
  const prisma = getPrisma(getRequestContext().env as any);
  return await prisma.student.findMany({
    where: { needsEfteqad: true },
    orderBy: { name: 'asc' }
  });
}

export async function logEfteqad(studentId: string, khademName: string, notes?: string) {
  const prisma = getPrisma(getRequestContext().env as any);
  return await prisma.$transaction(async (tx) => {
    const log = await tx.efteqadLog.create({
      data: { studentId, khademName, notes: notes || null }
    });
    await tx.student.update({
      where: { id: studentId },
      data: { needsEfteqad: false }
    });
    
    try {
      revalidatePath('/efteqad');
      revalidatePath('/students-list');
    } catch (e) {}
    
    return JSON.parse(JSON.stringify(log));
  });
}

export async function getEfteqadHistory(studentId: string) {
  const prisma = getPrisma(getRequestContext().env as any);
  return await prisma.efteqadLog.findMany({
    where: { studentId },
    orderBy: { date: 'desc' }
  });
}
