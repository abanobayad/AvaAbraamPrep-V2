"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { MEETING_TYPES, DAYS, DAY_LABELS, type DayName, type Schedule } from "@/config/meetings";
import { CLASSES } from "@/config/classes";

const GENERIC_ERROR = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Strips Dates for the client boundary; typed as any like the other actions so callers read res.data freely.
const serialize = (v: unknown): any => JSON.parse(JSON.stringify(v));

/** DATE columns come back as UTC midnight; everywhere else a session date is "YYYY-MM-DD". */
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const dateFromYmd = (s: string) => new Date(`${s}T00:00:00.000Z`);

/** The reason written on the points history, in Arabic for the students. */
function attendanceReason(title: string, date: Date) {
  const label = date.toLocaleDateString("ar-EG", { day: "numeric", month: "long", timeZone: "UTC" });
  return `حضور ${title} (${label})`;
}

const rosterWhere = (m: { studentClass: string | null }): Prisma.StudentWhereInput =>
  m.studentClass ? { studentClass: m.studentClass } : {};

export type MeetingInput = {
  title: string;
  category: string;
  points: number;
  frequency: string;
  day?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  schedule?: Partial<Record<string, { on?: boolean; begin?: string; end?: string }>> | null;
  studentClass?: string | null;
  notes?: string | null;
};

type ValidMeeting = {
  title: string;
  category: string;
  points: number;
  frequency: "weekly" | "daily";
  day: string;
  startTime: string;
  endTime: string | null;
  schedule: string | null;
  studentClass: string | null;
  notes: string | null;
};

/**
 * Title, points and the schedule. Weekly: one day + times. Daily (e.g. the
 * Liturgy): the ticked days, each with its own times; day/startTime/endTime are
 * set from the first held day so screens that read them keep working.
 */
function validateMeeting(data: MeetingInput): { ok: true; value: ValidMeeting } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  const title = (data?.title ?? "").trim();
  if (!title || title.length > 100) return fail("اسم الاجتماع مطلوب (حتى 100 حرف)");
  if (!MEETING_TYPES.some((t) => t.key === data.category)) return fail("نوع الاجتماع غير صالح");
  const points = Number(data.points);
  if (!Number.isInteger(points) || points < 0 || points > 1000) return fail("نقاط الحضور يجب أن تكون بين 0 و 1000");
  const frequency = data.frequency === "daily" ? "daily" : "weekly";
  const studentClass = data.studentClass && (CLASSES as readonly string[]).includes(data.studentClass) ? data.studentClass : null;
  const notes = data.notes?.trim() || null;
  const time = (v: unknown) => (typeof v === "string" && TIME_RE.test(v) ? v : null);

  if (frequency === "weekly") {
    if (!data.day || !(DAYS as readonly string[]).includes(data.day)) return fail("اختر يوم الاجتماع");
    const startTime = time(data.startTime);
    if (!startTime) return fail("اكتب ميعاد البداية");
    const endTime = time(data.endTime);
    if (data.endTime && !endTime) return fail("ميعاد النهاية غير صالح");
    return { ok: true, value: { title, category: data.category, points, frequency, day: data.day, startTime, endTime, schedule: null, studentClass, notes } };
  }

  const schedule: Schedule = {};
  for (const d of DAYS) {
    const row = data.schedule?.[d];
    if (!row || !row.on) continue;
    const begin = time(row.begin);
    if (!begin) return fail(`اكتب ميعاد البداية ليوم ${DAY_LABELS[d]}.`);
    const end = time(row.end);
    if (row.end && !end) return fail(`ميعاد النهاية ليوم ${DAY_LABELS[d]} غير صالح`);
    schedule[d] = { begin, end };
  }
  const first = DAYS.find((d) => schedule[d]) as DayName | undefined;
  if (!first) return fail("اختر يومًا واحدًا على الأقل.");
  const firstSlot = schedule[first]!;
  return {
    ok: true,
    value: { title, category: data.category, points, frequency, day: first, startTime: firstSlot.begin, endTime: firstSlot.end, schedule: JSON.stringify(schedule), studentClass, notes },
  };
}

/** Removes attendance rows and takes back the points each one awarded. */
async function reverseRows(tx: Prisma.TransactionClient, rows: { id: string; studentId: string; transactionId: string | null }[]) {
  let reversed = 0;
  for (const row of rows) {
    if (row.transactionId) {
      const t = await tx.transaction.findUnique({ where: { id: row.transactionId } });
      if (t) {
        await tx.transaction.delete({ where: { id: t.id } });
        await tx.student.update({ where: { id: row.studentId }, data: { totalPoints: { decrement: t.pointsChanged } } });
      }
    }
    await tx.meetingAttendance.delete({ where: { id: row.id } });
    reversed++;
  }
  return reversed;
}

const meetingInclude = {
  _count: { select: { sessions: true } },
  sessions: { orderBy: { date: "desc" as const }, take: 1, select: { date: true } },
};

function toMeetingRow(m: { sessions: { date: Date }[] } & Record<string, any>) {
  const { sessions, ...rest } = m;
  return { ...rest, lastSession: sessions[0] ? ymd(sessions[0].date) : null };
}

export async function getMeetings() {
  try {
    await requireRole("superadmin", "admin");
    const meetings = await prisma.meeting.findMany({ orderBy: { createdAt: "asc" }, include: meetingInclude });
    return { success: true, data: serialize(meetings.map(toMeetingRow)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function createMeeting(input: MeetingInput) {
  try {
    const session = await requireRole("superadmin", "admin");
    const v = validateMeeting(input);
    if (!v.ok) return { success: false, error: v.error };
    const meeting = await prisma.meeting.create({ data: { ...v.value, createdBy: session.username }, include: meetingInclude });
    return { success: true, data: serialize(toMeetingRow(meeting)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function updateMeeting(meetingId: string, input: MeetingInput) {
  try {
    await requireRole("superadmin", "admin");
    const v = validateMeeting(input);
    if (!v.ok) return { success: false, error: v.error };
    const exists = await prisma.meeting.findUnique({ where: { id: meetingId }, select: { id: true } });
    if (!exists) return { success: false, error: "الاجتماع غير موجود" };
    const meeting = await prisma.meeting.update({ where: { id: meetingId }, data: v.value, include: meetingInclude });
    return { success: true, data: serialize(toMeetingRow(meeting)) };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

/** Deletes a meeting with all its sessions and reverses every point they awarded. */
export async function deleteMeeting(meetingId: string) {
  try {
    await requireRole("superadmin", "admin");
    const reversed = await prisma.$transaction(
      async (tx) => {
        const m = await tx.meeting.findUnique({ where: { id: meetingId }, select: { id: true } });
        if (!m) throw new Error("NOT_FOUND");
        const rows = await tx.meetingAttendance.findMany({ where: { session: { meetingId } } });
        const n = await reverseRows(tx, rows);
        await tx.meeting.delete({ where: { id: meetingId } });
        return n;
      },
      { timeout: 60000 }
    );
    return { success: true, data: { reversed } };
  } catch (err: any) {
    if (err?.message === "NOT_FOUND") return { success: false, error: "الاجتماع غير موجود" };
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

/** A meeting with its sessions, attendance statistics and the most present / absent students. */
export async function getMeeting(meetingId: string) {
  try {
    await requireRole("superadmin", "admin");
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { sessions: { orderBy: { date: "asc" }, include: { _count: { select: { attendances: true } } } } },
    });
    if (!meeting) return { success: false, error: "الاجتماع غير موجود" };

    const roster = await prisma.student.findMany({ where: rosterWhere(meeting), select: { id: true, name: true, studentClass: true } });
    const rosterCount = roster.length;
    const sessionIds = meeting.sessions.map((s) => s.id);
    const counts = sessionIds.length
      ? await prisma.meetingAttendance.groupBy({ by: ["studentId"], where: { sessionId: { in: sessionIds } }, _count: { _all: true } })
      : [];
    const presentBy = new Map(counts.map((c) => [c.studentId, c._count._all]));

    const sessions = meeting.sessions.map((s) => {
      const present = s._count.attendances;
      const total = Math.max(rosterCount, present);
      const absent = total - present;
      return { id: s.id, date: ymd(s.date), present, absent, total, rate: total ? Math.round((present / total) * 100) : 0 };
    });
    const withData = sessions.filter((s) => s.total > 0);
    const stats = {
      sessions: sessions.length,
      students: rosterCount,
      avgRate: withData.length ? Math.round(withData.reduce((a, s) => a + s.rate, 0) / withData.length) : 0,
      best: withData.length ? withData.reduce((b, s) => (s.rate > b.rate ? s : b)) : null,
      last: sessions[sessions.length - 1] ?? null,
      totalPresent: sessions.reduce((a, s) => a + s.present, 0),
      totalAbsent: sessions.reduce((a, s) => a + s.absent, 0),
    };

    const byCount = (a: { count: number; name: string }, b: { count: number; name: string }) => b.count - a.count || a.name.localeCompare(b.name, "ar");
    const topPresent = roster
      .map((s) => ({ ...s, count: presentBy.get(s.id) ?? 0 }))
      .filter((s) => s.count > 0)
      .sort(byCount)
      .slice(0, 5);
    const topAbsent = roster
      .map((s) => ({ ...s, count: sessions.length - (presentBy.get(s.id) ?? 0) }))
      .filter((s) => s.count > 0)
      .sort(byCount)
      .slice(0, 5);

    const { sessions: _sessions, ...meetingRow } = meeting;
    return {
      success: true,
      data: serialize({
        meeting: { ...meetingRow, lastSession: stats.last?.date ?? null, _count: { sessions: sessions.length } },
        sessions,
        stats,
        topPresent,
        topAbsent,
      }),
    };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

/** Opens the attendance sheet of a meeting on a date, creating it on first use. */
export async function startSession(meetingId: string, date: string) {
  try {
    const session = await requireRole("superadmin", "admin");
    if (typeof date !== "string" || !DATE_RE.test(date)) return { success: false, error: "التاريخ غير صالح" };
    const d = dateFromYmd(date);
    if (isNaN(d.getTime()) || ymd(d) !== date) return { success: false, error: "التاريخ غير صالح" };
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, select: { id: true } });
    if (!meeting) return { success: false, error: "الاجتماع غير موجود" };

    const existing = await prisma.meetingSession.findUnique({ where: { meetingId_date: { meetingId, date: d } }, select: { id: true } });
    if (existing) return { success: true, data: { id: existing.id, existed: true } };
    try {
      const created = await prisma.meetingSession.create({ data: { meetingId, date: d, createdBy: session.username } });
      return { success: true, data: { id: created.id, existed: false } };
    } catch (e: any) {
      if (e?.code === "P2002") {
        const again = await prisma.meetingSession.findUnique({ where: { meetingId_date: { meetingId, date: d } }, select: { id: true } });
        if (again) return { success: true, data: { id: again.id, existed: true } };
      }
      throw e;
    }
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

/** Deletes one attendance sheet and takes back the points it awarded. */
export async function deleteSession(sessionId: string) {
  try {
    await requireRole("superadmin", "admin");
    const reversed = await prisma.$transaction(
      async (tx) => {
        const s = await tx.meetingSession.findUnique({ where: { id: sessionId }, select: { id: true } });
        if (!s) throw new Error("NOT_FOUND");
        const rows = await tx.meetingAttendance.findMany({ where: { sessionId } });
        const n = await reverseRows(tx, rows);
        await tx.meetingSession.delete({ where: { id: sessionId } });
        return n;
      },
      { timeout: 60000 }
    );
    return { success: true, data: { reversed } };
  } catch (err: any) {
    if (err?.message === "NOT_FOUND") return { success: false, error: "كشف الحضور غير موجود" };
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function getSession(sessionId: string) {
  try {
    await requireRole("superadmin", "admin");
    const s = await prisma.meetingSession.findUnique({
      where: { id: sessionId },
      include: { meeting: true, attendances: { select: { studentId: true } } },
    });
    if (!s) return { success: false, error: "كشف الحضور غير موجود" };
    const students = await prisma.student.findMany({
      where: rosterWhere(s.meeting),
      select: { id: true, name: true, studentClass: true },
      orderBy: [{ studentClass: "asc" }, { name: "asc" }],
    });
    return {
      success: true,
      data: serialize({
        session: { id: s.id, date: ymd(s.date), meetingId: s.meetingId },
        meeting: s.meeting,
        students,
        presentIds: s.attendances.map((a) => a.studentId),
      }),
    };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}

/**
 * Marks students present or absent on a sheet. Attendance feeds the board: a
 * newly present student gets the meeting's points once (keyed by session +
 * student, so repeating never doubles them); marking them absent takes the
 * points back.
 */
export async function markAttendance(sessionId: string, studentIds: string[], present: boolean) {
  try {
    const user = await requireRole("superadmin", "admin");
    if (!Array.isArray(studentIds) || studentIds.length === 0 || studentIds.length > 500 || studentIds.some((x) => typeof x !== "string")) {
      return { success: false, error: "بيانات غير صالحة" };
    }
    const ids = Array.from(new Set(studentIds));

    const result = await prisma.$transaction(
      async (tx) => {
        const s = await tx.meetingSession.findUnique({ where: { id: sessionId }, include: { meeting: true } });
        if (!s) throw new Error("NOT_FOUND");
        const existing = await tx.meetingAttendance.findMany({ where: { sessionId, studentId: { in: ids } } });
        let added = 0;
        let removed = 0;

        if (present) {
          const already = new Set(existing.map((r) => r.studentId));
          const label = attendanceReason(s.meeting.title, s.date);
          for (const studentId of ids) {
            if (already.has(studentId)) continue;
            const student = await tx.student.findUnique({ where: { id: studentId }, select: { id: true } });
            if (!student) continue;
            let transactionId: string | null = null;
            if (s.meeting.points > 0) {
              const t = await tx.transaction.create({
                data: { studentId, actionName: label, pointsChanged: s.meeting.points, addedBy: user.username },
              });
              await tx.student.update({ where: { id: studentId }, data: { totalPoints: { increment: s.meeting.points } } });
              transactionId = t.id;
            }
            await tx.meetingAttendance.create({ data: { sessionId, studentId, transactionId, recordedBy: user.username } });
            added++;
          }
        } else {
          removed = await reverseRows(tx, existing);
        }

        const presentCount = await tx.meetingAttendance.count({ where: { sessionId } });
        return { added, removed, presentCount, points: s.meeting.points };
      },
      { timeout: 60000 }
    );
    return { success: true, data: result };
  } catch (err: any) {
    if (err?.message === "NOT_FOUND") return { success: false, error: "كشف الحضور غير موجود" };
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}
