"use client"
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Search, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CLASSES } from "@/config/classes";
import { dayLabel, formatDateAr, monthLabel, type MeetingLike } from "@/config/meetings";
import type { SessionStat, StudentStat } from "@/app/actions/stats";
import { Badge } from "./MeetingsClient";
import { StudentAvatar } from "./StudentAvatar";

export type MeetingBlock = {
  meeting: MeetingLike & { id: string; title: string; studentClass: string | null };
  sessions: SessionStat[];
  latest: SessionStat | null;
};

export type AttendanceStats = {
  month: string | null;
  months: string[];
  totals: { sessions: number; marks: number; present: number; absent: number; rate: number };
  byMeeting: MeetingBlock[];
  students: StudentStat[];
  attended4: { month: string; students: StudentStat[] };
};

const ALL = "الكل";
const ALL_MONTHS = "all";

const rateTone = (r: number): "success" | "amber" | "danger" => (r >= 75 ? "success" : r >= 50 ? "amber" : "danger");

export function AttendanceStatsClient({ stats, backHref }: { stats: AttendanceStats; backHref: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState(ALL);

  const periodLabel = stats.month ? monthLabel(stats.month) : "كل الشهور";

  const filtered = useMemo(() => {
    const q = query.trim();
    return stats.students.filter((s) => (classFilter === ALL || s.studentClass === classFilter) && (!q || s.name.includes(q)));
  }, [stats.students, query, classFilter]);

  const mostPresent = useMemo(
    () => filtered.filter((s) => s.present > 0).sort((a, b) => b.present - a.present || b.rate - a.rate || a.name.localeCompare(b.name, "ar")),
    [filtered]
  );
  const mostAbsent = useMemo(
    () => filtered.filter((s) => s.absent > 0).sort((a, b) => b.absent - a.absent || a.rate - b.rate || a.name.localeCompare(b.name, "ar")),
    [filtered]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">التقارير</p>
          <h1 className="mt-1 text-3xl font-bold text-primary">إحصائيات الحضور</h1>
          <p className="text-muted-foreground mt-1">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={stats.month ?? ALL_MONTHS} onValueChange={(v) => router.push(v === ALL_MONTHS ? "/attendance-stats" : `/attendance-stats?month=${v}`)}>
            <SelectTrigger dir="rtl" className="w-48" aria-label="الشهر"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_MONTHS}>كل الشهور</SelectItem>
              {stats.months.map((m) => (
                <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link href="/meetings"><CalendarCheck className="h-4 w-4 ml-2" />الاجتماعات</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={backHref}><ArrowRight className="h-4 w-4 ml-2" />العودة للرئيسية</Link>
          </Button>
        </div>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">الجلسات</p>
          <p className="mt-2 text-3xl font-bold">{stats.totals.sessions}</p>
          <p className="mt-3 text-xs text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">الحضور</p>
          <p className="mt-2 text-3xl font-bold">{stats.totals.rate}<span className="text-base font-medium text-muted-foreground">%</span></p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${stats.totals.rate}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{stats.totals.present} حاضر من {stats.totals.marks} تسجيل</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">حاضر</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.totals.present}</p>
          <p className="mt-3 text-xs text-muted-foreground">تسجيلات الحضور</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">غائب</p>
          <p className="mt-2 text-3xl font-bold text-rose-600">{stats.totals.absent}</p>
          <p className="mt-3 text-xs text-muted-foreground">تسجيلات الغياب</p>
        </div>
      </div>

      {/* Recent attendance by meeting */}
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-bold">الحضور الأخير <span className="font-normal text-muted-foreground">· حسب الاجتماع</span></h2>
          <Link href="/meetings" className="text-sm font-bold text-primary hover:underline">كل الاجتماعات</Link>
        </div>
        <div className="px-4 pt-1">
          {stats.byMeeting.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا توجد اجتماعات بعد. أضف اجتماعًا لبدء تسجيل الحضور.</p>
          ) : (
            stats.byMeeting.map(({ meeting, sessions, latest }) => (
              <div key={meeting.id} className="border-b py-4 last:border-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/meetings/${meeting.id}`} className="block truncate font-bold text-primary hover:underline">{meeting.title}</Link>
                    <p className="text-xs font-medium text-muted-foreground">{dayLabel(meeting)} · {meeting.studentClass ?? "كل المراحل"}</p>
                  </div>
                  <div className="flex h-9 items-end gap-1">
                    {sessions.map((s) => (
                      <div key={s.id} className="relative h-full w-2 overflow-hidden rounded bg-emerald-100" title={`${formatDateAr(s.date)} — ${s.present}/${s.total} حاضر`}>
                        <div className="absolute inset-x-0 bottom-0 rounded bg-emerald-500" style={{ height: `${Math.max(s.rate, 4)}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
                {latest && latest.total > 0 ? (
                  <>
                    <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${latest.present} حاضر، ${latest.absent} غائب`}>
                      {latest.present > 0 && <div className="bg-emerald-500" style={{ width: `${latest.rate}%` }} />}
                      {latest.absent > 0 && <div className="bg-rose-500" style={{ width: `${100 - latest.rate}%` }} />}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" />حاضر <b className="text-foreground">{latest.present}</b></span>
                      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-rose-500" />غائب <b className="text-foreground">{latest.absent}</b></span>
                      <span className="mr-auto">
                        {formatDateAr(latest.date, { day: "numeric", month: "short" })} · <Link href={`/attendance/${latest.id}`} className="font-bold text-primary hover:underline">التفاصيل</Link>
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">لا توجد جلسات مسجّلة في هذه الفترة.</p>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Attended four times or more */}
      {stats.attended4.students.length > 0 && (
        <section className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3 font-bold">
            حضر 4 مرات أو أكثر <span className="font-normal text-muted-foreground">· {monthLabel(stats.attended4.month)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
            {stats.attended4.students.map((s) => (
              <div key={s.id} className="flex flex-col items-center rounded-xl border p-4 text-center">
                <StudentAvatar name={s.name} id={s.id} size={56} />
                <span className="mt-3 text-sm font-bold">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.studentClass}</span>
                <span className="mt-1 text-xs font-bold text-emerald-600">{s.present} ×</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rankings */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[ALL, ...CLASSES].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setClassFilter(c)}
              aria-current={classFilter === c ? "true" : undefined}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors",
                classFilter === c ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث بالاسم" aria-label="بحث" className="pr-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RankingTable title="الأكثر حضورًا" subtitle="المواظبون على الحضور" rows={mostPresent} countKey="present" tone="text-emerald-600" empty="لا يوجد حضور مسجّل في هذه الفترة." />
        <RankingTable title="الأكثر غيابًا" subtitle="من يحتاج افتقادًا" rows={mostAbsent} countKey="absent" tone="text-rose-600" empty="لا يوجد غياب مسجّل في هذه الفترة." />
      </div>
    </div>
  );
}

function RankingTable({
  title,
  subtitle,
  rows,
  countKey,
  tone,
  empty,
}: {
  title: string;
  subtitle: string;
  rows: StudentStat[];
  countKey: "present" | "absent";
  tone: string;
  empty: string;
}) {
  return (
    <section className="rounded-lg border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="font-bold">{title} <span className="font-normal text-muted-foreground">· {subtitle}</span></h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>الاسم</TableHead>
            <TableHead className="text-center">{countKey === "present" ? "حاضر" : "غائب"}</TableHead>
            <TableHead className="text-center">النسبة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">{empty}</TableCell>
            </TableRow>
          ) : (
            rows.map((s, i) => (
              <TableRow key={s.id}>
                <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <StudentAvatar name={s.name} id={s.id} size={36} />
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{s.name}</span>
                      <span className="block text-xs text-muted-foreground">{s.studentClass} · {s.present} من {s.applicable} جلسة</span>
                    </span>
                  </div>
                </TableCell>
                <TableCell className={cn("text-center text-lg font-bold tabular-nums", tone)}>
                  {s[countKey]}<span className="mr-0.5 text-xs font-medium text-muted-foreground">×</span>
                </TableCell>
                <TableCell className="text-center"><Badge tone={rateTone(s.rate)}>{s.rate}%</Badge></TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}
