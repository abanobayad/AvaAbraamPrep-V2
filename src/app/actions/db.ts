"use server";

import { prisma } from "@/lib/prisma";
import { EFTEQAD_ENABLED } from "@/lib/features";
import { requireRole } from "@/lib/authz";
import { hashPassword } from "@/lib/password";
import { safeHttpUrl } from "@/lib/url";

const GENERIC_ERROR = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";

export async function getStudents(studentClass?: string) {
  try {
    await requireRole("superadmin", "admin");
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

    if (!/^[؀-ۿ\s]+$/.test(data.name.trim())) {
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
    const result = await prisma.khadem.findMany({
      where: { role: { not: 'student' } },
      select: { id: true, name: true, username: true, role: true, createdAt: true }
    });
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function addKhadem(data: { name: string; username: string; password: string; role: string }) {
  try {
    await requireRole("superadmin");
    if (!["admin", "superadmin"].includes(data.role)) return { success: false, error: "الصلاحية غير صالحة" };
    if (!data.username?.trim() || !data.name?.trim()) return { success: false, error: "الاسم واسم المستخدم مطلوبان" };
    if (!data.password || data.password.length < 8 || data.password.length > 64) {
      return { success: false, error: "كلمة السر يجب أن تكون بين 8 و 64 حرف" };
    }
    const hashedPassword = await hashPassword(data.password);
    const khadem = await prisma.khadem.create({
      data: {
        name: data.name.trim(),
        username: data.username.trim(),
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
    const session = await requireRole("superadmin");
    if (session.id === id) return { success: false, error: "لا يمكنك حذف حسابك الحالي" };
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

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, studentClass: true },
    });
    if (!student) {
      return { success: false, error: "الطالب غير موجود" };
    }

    // Record the transaction and bump the total atomically.
    const [, updated] = await prisma.$transaction([
      prisma.transaction.create({
        data: { studentId, actionName: actionName.trim(), pointsChanged: points, addedBy },
      }),
      prisma.student.update({
        where: { id: studentId },
        data: { totalPoints: { increment: points } },
        select: { totalPoints: true },
      }),
    ]);

    return {
      success: true,
      data: {
        id: student.id,
        name: student.name,
        studentClass: student.studentClass,
        totalPoints: updated.totalPoints,
      }
    };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function getStudentHistory(studentId: string) {
  try {
    const session = await requireRole("superadmin", "admin", "student");
    if (session.role === "student" && session.id !== studentId) {
      throw new Error("Forbidden");
    }
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
    if (!/^[؀-ۿ\s]+$/.test(data.name.trim())) {
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
    const url = safeHttpUrl(data.url);
    if (!url) return { success: false, error: "الرابط غير صالح. يجب أن يبدأ بـ http:// أو https://" };
    const title = (data.title ?? "").trim();
    if (!title || title.length > 200) return { success: false, error: "العنوان مطلوب (حتى 200 حرف)" };
    if (!["video", "document", "image", "link"].includes(data.type)) return { success: false, error: "النوع غير صالح" };
    const media = await prisma.media.create({
      data: { title, url, type: data.type }
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

    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
    if (!student) {
      return { success: false, error: "الطالب غير موجود" };
    }

    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { studentId } }),
      prisma.attendance.deleteMany({ where: { studentId } }),
      prisma.efteqadLog.deleteMany({ where: { studentId } }),
      prisma.student.delete({ where: { id: studentId } }),
    ]);

    return { success: true, data: null };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}
