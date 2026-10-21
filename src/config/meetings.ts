/** Meeting / activity types and the points each attendee earns. Keep in sync with the quick-award buttons. */
export const MEETING_TYPES = [
  { key: "MASS", label: "حضور قداس", points: 100 },
  { key: "SUNDAY_SCHOOL", label: "مدارس الأحد", points: 75 },
  { key: "PRAISE_VESPERS", label: "تسبحة وعشية", points: 75 },
  { key: "HYMNS", label: "درس الألحان", points: 50 },
  { key: "BIBLE_STUDY", label: "درس الكتاب", points: 50 },
  { key: "GAME", label: "دوري / نشاط", points: 50 },
  { key: "OTHER", label: "أخرى", points: 25 },
] as const;

export type MeetingTypeKey = (typeof MEETING_TYPES)[number]["key"];

export function meetingTypeLabel(key: string): string {
  return MEETING_TYPES.find((t) => t.key === key)?.label ?? key;
}

/** Week order used by the forms (the service week starts on Saturday). */
export const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
export type DayName = (typeof DAYS)[number];

export const DAY_LABELS: Record<DayName, string> = {
  Saturday: "السبت",
  Sunday: "الأحد",
  Monday: "الإثنين",
  Tuesday: "الثلاثاء",
  Wednesday: "الأربعاء",
  Thursday: "الخميس",
  Friday: "الجمعة",
};

export const FREQUENCIES = [
  { key: "weekly", label: "أسبوعي", hint: "يوم واحد في الأسبوع وميعاد ثابت.", icon: "📅" },
  { key: "daily", label: "يومي (مثل حضور القداس)", hint: "يتكرر يوميًا، ولكل يوم ميعاده الخاص.", icon: "⛪" },
] as const;
export type Frequency = (typeof FREQUENCIES)[number]["key"];

export type Slot = { begin: string; end: string | null };
export type Schedule = Partial<Record<DayName, Slot>>;

/** The fields of a meeting the schedule helpers need (serialized rows included). */
export type MeetingLike = {
  frequency: string;
  day: string | null;
  startTime: string | null;
  endTime: string | null;
  schedule: string | null;
};

export const isDaily = (m: MeetingLike) => m.frequency === "daily";

export function parseSchedule(raw: string | null | undefined): Schedule {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    const out: Schedule = {};
    for (const d of DAYS) {
      const row = obj?.[d];
      if (row && typeof row.begin === "string" && row.begin) {
        out[d] = { begin: row.begin, end: typeof row.end === "string" && row.end ? row.end : null };
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** Held days with their times, in week order. A weekly meeting has one entry. */
export function slots(m: MeetingLike): Schedule {
  if (!isDaily(m)) {
    if (!m.day || !m.startTime) return {};
    return { [m.day as DayName]: { begin: m.startTime, end: m.endTime || null } };
  }
  return parseSchedule(m.schedule);
}

const JS_DAYS: DayName[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Weekday name of a calendar date given as "YYYY-MM-DD" (no timezone shift). */
export function dayNameOf(ymd: string): DayName {
  const [y, mo, d] = ymd.split("-").map(Number);
  return JS_DAYS[new Date(y, mo - 1, d).getDay()];
}

/** The times on a given date, or null when the meeting is not held that day. */
export function slotOn(m: MeetingLike, ymd: string): Slot | null {
  return slots(m)[dayNameOf(ymd)] ?? null;
}

/** "السبت" for a weekly meeting, "يومي" for a daily one. */
export function dayLabel(m: MeetingLike): string {
  if (isDaily(m)) return "يومي";
  return m.day && m.day in DAY_LABELS ? DAY_LABELS[m.day as DayName] : "—";
}

/** Local calendar date as "YYYY-MM-DD". */
export function toYmd(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(ymd: string, n: number): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  return toYmd(new Date(y, mo - 1, d + n));
}

/**
 * The next date the meeting is held: today when it is held today, otherwise the
 * coming held day (today when the schedule is unknown).
 */
export function nextOccurrence(m: MeetingLike, from: string = toYmd()): string {
  const held = slots(m);
  for (let i = 0; i < 7; i++) {
    const date = addDays(from, i);
    if (held[dayNameOf(date)]) return date;
  }
  return from;
}

/** "19:30" becomes "7:30 م". */
export function formatTime(hhmm: string | null | undefined): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return hhmm;
  const suffix = h >= 12 ? "م" : "ص";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Arabic date for a "YYYY-MM-DD" string, e.g. "الأحد، ٢١ أكتوبر ٢٠٢٦". */
export function formatDateAr(
  ymd: string,
  opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("ar-EG", opts);
}

/** "2026-10" becomes "أكتوبر ٢٠٢٦". */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
}

/** Arabic plural of "نقطة" for a count. */
export function pointsWord(n: number): string {
  const a = Math.abs(n);
  if (a === 0) return "نقاط";
  if (a === 1) return "نقطة";
  if (a === 2) return "نقطتان";
  if (a <= 10) return "نقاط";
  return "نقطة";
}
