"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

const GENERIC_ERROR = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const serialize = (v: unknown): any => JSON.parse(JSON.stringify(v));
const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** "YYYY-MM" of the month before the given one. */
function previousMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type StudentStat = { id: string; name: string; studentClass: string; present: number; absent: number; applicable: number; rate: number };
export type SessionStat = { id: string; date: string; present: number; absent: number; total: number; rate: number };

/**
 * Attendance statistics for one month ("YYYY-MM") or all time (null): headline
 * totals, the recent sessions of every meeting, each student's present / absent
 * counts, and who attended four times or more. A student counts as absent from a
 * session when the meeting covers their class and they were not marked present.
 */
export async function getAttendanceStats(month?: string | null) {
  try {
    await requireRole("superadmin", "admin");
    const period = month && MONTH_RE.test(month) ? month : null;

    const [meetings, allSessions, students] = await Promise.all([
      prisma.meeting.findMany({
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true, frequency: true, day: true, startTime: true, endTime: true, schedule: true, studentClass: true },
      }),
      prisma.meetingSession.findMany({
        orderBy: { date: "asc" },
        select: { id: true, meetingId: true, date: true, attendances: { select: { studentId: true } } },
      }),
      prisma.student.findMany({ select: { id: true, name: true, studentClass: true }, orderBy: { name: "asc" } }),
    ]);

    const meetingById = new Map(meetings.map((m) => [m.id, m]));
    const rosterOf = (studentClass: string | null) => (studentClass ? students.filter((s) => s.studentClass === studentClass) : students);

    type Row = { id: string; meetingId: string; date: string; present: Set<string>; rosterIds: Set<string>; total: number; absent: number; rate: number };
    const rows: Row[] = allSessions.map((s) => {
      const meeting = meetingById.get(s.meetingId);
      const rosterIds = new Set(rosterOf(meeting?.studentClass ?? null).map((st) => st.id));
      const present = new Set(s.attendances.map((a) => a.studentId));
      const total = Math.max(rosterIds.size, present.size);
      const absent = total - present.size;
      return { id: s.id, meetingId: s.meetingId, date: ymd(s.date), present, rosterIds, total, absent, rate: total ? Math.round((present.size / total) * 100) : 0 };
    });

    const months = Array.from(new Set(rows.map((r) => r.date.slice(0, 7)))).sort().reverse();
    const inPeriod = period ? rows.filter((r) => r.date.startsWith(period)) : rows;

    const totals = {
      sessions: inPeriod.length,
      marks: inPeriod.reduce((a, r) => a + r.total, 0),
      present: inPeriod.reduce((a, r) => a + r.present.size, 0),
      absent: inPeriod.reduce((a, r) => a + r.absent, 0),
      rate: 0,
    };
    totals.rate = totals.marks ? Math.round((totals.present / totals.marks) * 100) : 0;

    const toSession = (r: Row): SessionStat => ({ id: r.id, date: r.date, present: r.present.size, absent: r.absent, total: r.total, rate: r.rate });

    const byMeeting = meetings
      .map((m) => {
        const sessions = inPeriod.filter((r) => r.meetingId === m.id).slice(-6).map(toSession);
        return { meeting: m, sessions, latest: sessions[sessions.length - 1] ?? null };
      })
      .sort((a, b) => (b.latest?.date ?? "").localeCompare(a.latest?.date ?? ""));

    const statsFor = (list: Row[]): StudentStat[] =>
      students.map((s) => {
        let applicable = 0;
        let present = 0;
        for (const r of list) {
          if (r.present.has(s.id)) {
            present++;
            applicable++;
          } else if (r.rosterIds.has(s.id)) {
            applicable++;
          }
        }
        const absent = applicable - present;
        return { ...s, present, absent, applicable, rate: applicable ? Math.round((present / applicable) * 100) : 0 };
      });

    const studentStats = statsFor(inPeriod);

    // Thanawy's "attended 4 times or more": the chosen month, or the previous month when viewing all time.
    const now = new Date();
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const attendedMonth = period ?? previousMonth(currentMonth);
    const attended4 = statsFor(rows.filter((r) => r.date.startsWith(attendedMonth)))
      .filter((s) => s.present >= 4)
      .sort((a, b) => b.present - a.present || a.name.localeCompare(b.name, "ar"));

    return {
      success: true,
      data: serialize({ month: period, months, totals, byMeeting, students: studentStats, attended4: { month: attendedMonth, students: attended4 } }),
    };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, error: GENERIC_ERROR };
  }
}
