"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { MEETING_TYPES } from "@/config/meetings";
import { CLASSES } from "@/config/classes";

const GENERIC_ERROR = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";

// Strips Dates for the client boundary; typed as any like the other actions so callers read res.data freely.
const serialize = (v: unknown): any => JSON.parse(JSON.stringify(v));

function formatDate(d: Date) {
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
}

export async function getMeetings() {
  try {
    await requireRole("superadmin", "admin");
    const meetings = await prisma.meeting.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { attendances: true } } },
    });
    return { success: true, data: serialize(meetings) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function createMeeting(data: {
  title: string;
  category: string;
  points: number;
  date: string;
  studentClass?: string | null;
  notes?: string;
}) {
  try {
    const session = await requireRole("superadmin", "admin");
    const title = (data.title ?? "").trim();
    if (!title || title.length > 100) return { success: false, error: "اسم الاجتماع مطلوب (حتى 100 حرف)" };
    if (!MEETING_TYPES.some((t) => t.key === data.category)) return { success: false, error: "نوع الاجتماع غير صالح" };
    const points = Number(data.points);
    if (!Number.isInteger(points) || points < 1 || points > 200) return { success: false, error: "النقاط يجب أن تكون بين 1 و 200" };
    const date = new Date(data.date);
    if (isNaN(date.getTime())) return { success: false, error: "التاريخ غير صالح" };
    const studentClass = data.studentClass && (CLASSES as readonly string[]).includes(data.studentClass) ? data.studentClass : null;

    const meeting = await prisma.meeting.create({
      data: {
        title,
        category: data.category,
        points,
        date,
        studentClass,
        notes: data.notes?.trim() || null,
        createdBy: session.username,
      },
    });
    return { success: true, data: serialize({ ...meeting, _count: { attendances: 0 } }) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

/** Deletes a meeting and reverses every point it awarded. */
export async function deleteMeeting(meetingId: string) {
  try {
    await requireRole("superadmin", "admin");
    await prisma.$transaction(async (tx) => {
      const rows = await tx.meetingAttendance.findMany({ where: { meetingId }, select: { studentId: true, transactionId: true } });
      for (const row of rows) {
        if (!row.transactionId) continue;
        const t = await tx.transaction.findUnique({ where: { id: row.transactionId } });
        if (!t) continue;
        await tx.transaction.delete({ where: { id: t.id } });
        await tx.student.update({ where: { id: row.studentId }, data: { totalPoints: { decrement: t.pointsChanged } } });
      }
      await tx.meeting.delete({ where: { id: meetingId } });
    });
    return { success: true, data: null };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function getMeetingWithStudents(meetingId: string) {
  try {
    await requireRole("superadmin", "admin");
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) return { success: false, error: "الاجتماع غير موجود" };
    const [students, attendances] = await Promise.all([
      prisma.student.findMany({
        where: meeting.studentClass ? { studentClass: meeting.studentClass } : undefined,
        select: { id: true, name: true, studentClass: true, studentCode: true },
        orderBy: [{ studentClass: "asc" }, { name: "asc" }],
      }),
      prisma.meetingAttendance.findMany({ where: { meetingId }, select: { studentId: true } }),
    ]);
    return {
      success: true,
      data: serialize({ meeting, students, presentIds: attendances.map((a) => a.studentId) }),
    };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

/**
 * Replaces the attendance list of a meeting. Newly present students get the meeting's
 * points once; students removed from the list have those points taken back.
 */
export async function saveAttendance(meetingId: string, presentIds: string[]) {
  try {
    const session = await requireRole("superadmin", "admin");
    if (!Array.isArray(presentIds)) return { success: false, error: "بيانات غير صالحة" };
    const wanted = new Set(presentIds.filter((id) => typeof id === "string"));

    const result = await prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.findUnique({ where: { id: meetingId } });
      if (!meeting) throw new Error("NOT_FOUND");
      const existing = await tx.meetingAttendance.findMany({ where: { meetingId } });
      const existingIds = new Set(existing.map((a) => a.studentId));
      const label = `${meeting.title} (${formatDate(meeting.date)})`;

      let added = 0;
      let removed = 0;

      for (const studentId of Array.from(wanted)) {
        if (existingIds.has(studentId)) continue;
        const student = await tx.student.findUnique({ where: { id: studentId }, select: { id: true } });
        if (!student) continue;
        const t = await tx.transaction.create({
          data: { studentId, actionName: label, pointsChanged: meeting.points, addedBy: session.username },
        });
        await tx.student.update({ where: { id: studentId }, data: { totalPoints: { increment: meeting.points } } });
        await tx.meetingAttendance.create({
          data: { meetingId, studentId, transactionId: t.id, recordedBy: session.username },
        });
        added++;
      }

      for (const row of existing) {
        if (wanted.has(row.studentId)) continue;
        if (row.transactionId) {
          const t = await tx.transaction.findUnique({ where: { id: row.transactionId } });
          if (t) {
            await tx.transaction.delete({ where: { id: t.id } });
            await tx.student.update({ where: { id: row.studentId }, data: { totalPoints: { decrement: t.pointsChanged } } });
          }
        }
        await tx.meetingAttendance.delete({ where: { id: row.id } });
        removed++;
      }

      return { added, removed, present: wanted.size, points: meeting.points };
    });

    return { success: true, data: serialize(result) };
  } catch (err: any) {
    if (err?.message === "NOT_FOUND") return { success: false, error: "الاجتماع غير موجود" };
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}
