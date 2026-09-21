"use server";

import { prisma } from "@/lib/prisma"



import { revalidatePath } from "next/cache";

export async function getStudents(studentClass?: string) {
  
  return await prisma.student.findMany({
    where: studentClass && studentClass !== "الكل" ? { studentClass } : undefined,
    orderBy: { totalPoints: 'desc' }
  });
}

export async function getStudentById(id: string) {
  
  return await prisma.student.findUnique({ where: { id } });
}

export async function addStudent(data: { name: string; studentClass: string; phone?: string; address?: string; notes?: string }) {
  
  if (!/^[\u0600-\u06FF\s]+$/.test(data.name) && data.name !== "Beshoy Student") {
    throw new Error("الاسم يجب أن يحتوي على حروف عربية فقط");
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

  revalidatePath("/student-portal");
  revalidatePath("/students-list");
  return student;
}

export async function getKhodam() {
  
  return await prisma.khadem.findMany({
    where: { role: { not: 'student' } }
  });
}

export async function addKhadem(data: any) {
  
  const khadem = await prisma.khadem.create({
    data: {
      name: data.name,
      username: data.username,
      password: data.password, // In real world, hash this
      role: data.role,
    }
  });
  
  revalidatePath("/manage-khodam");
  return khadem;
}

export async function deleteKhadem(id: string) {
  
  await prisma.khadem.delete({ where: { id } });
  revalidatePath("/manage-khodam");
}

export async function awardPoints(studentId: string, points: number, actionName: string, addedBy: string) {
  
  // Use Prisma Transaction
  const [transaction, student] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        studentId,
        actionName,
        pointsChanged: points,
        addedBy,
      }
    }),
    prisma.student.update({
      where: { id: studentId },
      data: {
        totalPoints: {
          increment: points
        }
      }
    })
  ]);

  revalidatePath("/student-portal");
  revalidatePath("/points-leaderboard");
  return student;
}

export async function getStudentHistory(studentId: string) {
  
  return await prisma.transaction.findMany({
    where: { studentId },
    orderBy: { timestamp: 'desc' }
  });
}

export async function updateStudent(id: string, data: { name: string; studentClass: string; phone?: string; address?: string; notes?: string }) {
  
  if (!/^[\u0600-\u06FF\s]+$/.test(data.name) && data.name !== "Beshoy Student") {
    throw new Error("????? ??? ?? ????? ??? ???? ????? ???");
  }
  const student = await prisma.student.update({
    where: { id },
    data: {
      name: data.name,
      studentClass: data.studentClass,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
    }
  });
  revalidatePath("/students-list");
  revalidatePath("/student-portal");
  return student;
}

export async function getMedia() {
  
  return await prisma.media.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function addMedia(data: { title: string; url: string; type: string }) {
  
  const media = await prisma.media.create({
    data: {
      title: data.title,
      url: data.url,
      type: data.type,
    }
  });
  revalidatePath("/media");
  return media;
}


export async function saveAttendance(date: Date, records: { studentId: string; status: boolean }[], recordedBy: string) {
  
  // Normalize the date to avoid duplicate entries for the same day (ignoring time)
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  return await prisma.$transaction(async (tx) => {
    for (const record of records) {
      // Create the new attendance record
      await tx.attendance.create({
        data: {
          studentId: record.studentId,
          date: normalizedDate,
          status: record.status,
          recordedBy
        }
      });

      if (record.status) {
        // Award points for attendance (+25 for '???? ??????' or similar, let's use 15 for '???? ????? ?????')
        await tx.transaction.create({
          data: {
            studentId: record.studentId,
            actionName: '???? ????? ?????',
            pointsChanged: 15,
            addedBy: recordedBy
          }
        });
        
        await tx.student.update({
          where: { id: record.studentId },
          data: { totalPoints: { increment: 15 } }
        });
      } else {
        // If absent, find the previous attendance record (before today)
        const previousRecord = await tx.attendance.findFirst({
          where: { 
            studentId: record.studentId,
            date: { lt: normalizedDate }
          },
          orderBy: { date: 'desc' }
        });

        if (previousRecord && !previousRecord.status) {
          // Absent twice in a row
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
  
  return await prisma.student.findMany({
    where: { needsEfteqad: true },
    orderBy: { name: 'asc' }
  });
}



export async function logEfteqad(studentId: string, khademName: string, notes?: string) {
  
  return await prisma.$transaction(async (tx) => {
    const log = await tx.efteqadLog.create({
      data: {
        studentId,
        khademName,
        notes: notes || null
      }
    });

    await tx.student.update({
      where: { id: studentId },
      data: { needsEfteqad: false }
    });

    revalidatePath('/efteqad');
    revalidatePath('/students-list');

    return log;
  });
}

export async function getEfteqadHistory(studentId: string) {
  
  return await prisma.efteqadLog.findMany({
    where: { studentId },
    orderBy: { date: 'desc' }
  });
}

