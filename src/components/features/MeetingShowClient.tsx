"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus, Pencil, Loader2, Trash2, Church } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { SERVER_UNREACHABLE } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { DAYS, DAY_LABELS, meetingTypeLabel, isDaily, slots, slotOn, nextOccurrence, toYmd, dayNameOf, formatTime, formatDateAr, type DayName } from "@/config/meetings";
import { startSession, deleteSession, updateMeeting, type MeetingInput } from "@/app/actions/meetings";
import { MeetingForm } from "./MeetingForm";
import { Badge, DayBadge, type MeetingRow } from "./MeetingsClient";
import { StudentAvatar } from "./StudentAvatar";

export type SessionRow = { id: string; date: string; present: number; absent: number; total: number; rate: number };
export type MeetingStats = {
  sessions: number;
  students: number;
  avgRate: number;
  best: SessionRow | null;
  last: SessionRow | null;
  totalPresent: number;
  totalAbsent: number;
};
export type RankRow = { id: string; name: string; studentClass: string; count: number };

const rateTone = (r: number): "success" | "amber" | "danger" => (r >= 75 ? "success" : r >= 50 ? "amber" : "danger");
const shortDate = (ymd: string) => formatDateAr(ymd, { day: "numeric", month: "short" });

export function MeetingShowClient({
  meeting: initialMeeting,
  sessions: initialSessions,
  stats,
  topPresent,
  topAbsent,
}: {
  meeting: MeetingRow;
  sessions: SessionRow[];
  stats: MeetingStats;
  topPresent: RankRow[];
  topAbsent: RankRow[];
}) {
  const [meeting, setMeeting] = useState(initialMeeting);
  const [sessions, setSessions] = useState(initialSessions);
  useEffect(() => setMeeting(initialMeeting), [initialMeeting]);
  useEffect(() => setSessions(initialSessions), [initialSessions]);

  // The browser's calendar date (set after mount so server and client markup match).
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(toYmd()), []);

  const [startOpen, setStartOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [toDelete, setToDelete] = useState<SessionRow | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const daily = isDaily(meeting);
  const held = slots(meeting);
  const todaySlot = today ? slotOn(meeting, today) : null;
  const chart = sessions.slice(-12);

  const open = async (date: string) => {
    setBusy(true);
    try {
      const res = await startSession(meeting.id, date);
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE);
      const { id, existed } = res.data!;
      if (existed) toast({ title: "كشف موجود", description: "تم فتح كشف الحضور المسجّل لهذا التاريخ." });
      else toast({ title: "تم بدء الحضور", description: "علّم الحاضرين وتُضاف النقاط تلقائيًا.", className: "bg-success text-white" });
      router.push(`/attendance/${id}`);
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
      setBusy(false);
    }
  };

  const update = async (input: MeetingInput) => {
    setBusy(true);
    try {
      const res = await updateMeeting(meeting.id, input);
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE);
      setMeeting(res.data);
      setEditOpen(false);
      router.refresh();
      toast({ title: "تم تحديث الاجتماع", className: "bg-success text-white" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      const res = await deleteSession(toDelete.id);
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE);
      setSessions((prev) => prev.filter((s) => s.id !== toDelete.id));
      setToDelete(null);
      router.refresh();
      toast({ title: "تم حذف الجلسة", description: res.data?.reversed ? `تم استرجاع النقاط من ${res.data.reversed} مخدوم.` : undefined });
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/meetings" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4" />
        الاجتماعات
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">اجتماع</p>
          <h1 className="mt-1 text-3xl font-bold text-primary">{meeting.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <DayBadge meeting={meeting} />
            {!daily && (
              <span className="tabular-nums">
                {formatTime(meeting.startTime)}{meeting.endTime ? ` – ${formatTime(meeting.endTime)}` : ""}
              </span>
            )}
            <span>· {meetingTypeLabel(meeting.category)}</span>
            <span>· {meeting.studentClass ?? "كل المراحل"}</span>
            <Badge tone={meeting.points > 0 ? "accent" : "slate"}><span dir="ltr">+{meeting.points}</span> نقطة لكل حاضر</Badge>
          </div>
          {meeting.notes && <p className="mt-2 text-sm text-muted-foreground">{meeting.notes}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {daily && (
            <Button onClick={() => today && open(today)} disabled={busy || !today}>
              <Church className="ml-2 h-4 w-4" />
              حضور النهارده
              {todaySlot && <span className="mr-2 text-xs opacity-80 tabular-nums">{formatTime(todaySlot.begin)}</span>}
            </Button>
          )}
          <Button
            variant={daily ? "outline" : "default"}
            onClick={() => {
              setStartDate(nextOccurrence(meeting, today ?? undefined));
              setStartOpen(true);
            }}
            disabled={busy}
          >
            <Plus className="ml-2 h-4 w-4" />
            بدء الحضور
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)} disabled={busy}>
            <Pencil className="ml-2 h-4 w-4" />
            تعديل
          </Button>
        </div>
      </div>

      {/* Daily meeting: the week's times */}
      {daily && (
        <section className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3 font-bold">مواعيد الأسبوع</div>
          <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 lg:grid-cols-7">
            {DAYS.map((d) => {
              const slot = held[d];
              const isToday = today ? dayNameOf(today) === d : false;
              return (
                <div key={d} className={cn("rounded-xl border px-3 py-2", isToday ? "border-primary" : "border-border", !slot && "opacity-50")}>
                  <p className="text-xs font-bold text-muted-foreground">{DAY_LABELS[d]}{isToday && " · النهارده"}</p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums">
                    {slot ? `${formatTime(slot.begin)}${slot.end ? ` – ${formatTime(slot.end)}` : ""}` : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">الجلسات</p>
          <p className="mt-2 text-3xl font-bold">{stats.sessions}</p>
          <p className="mt-2 text-xs text-muted-foreground">{stats.totalPresent} حاضر · {stats.totalAbsent} غائب إجمالًا</p>
        </div>
        <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
          <div className="relative h-16 w-16 shrink-0">
            <div className="h-full w-full rounded-full" style={{ background: `conic-gradient(#10b981 ${stats.avgRate * 3.6}deg, hsl(var(--muted)) 0)` }} />
            <div className="absolute inset-[5px] grid place-items-center rounded-full bg-card">
              <span className="text-sm font-bold">{stats.avgRate}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">متوسط الحضور</p>
            <p className="mt-1 text-xs text-muted-foreground">عبر كل الجلسات</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">آخر جلسة</p>
          {stats.last && stats.last.total > 0 ? (
            <>
              <p className="mt-2 text-3xl font-bold">{stats.last.rate}<span className="text-base font-medium text-muted-foreground">%</span></p>
              <p className="mt-2 text-xs text-muted-foreground">{stats.last.present}/{stats.last.total} · {shortDate(stats.last.date)}</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-2xl font-bold text-muted-foreground/50">—</p>
              <p className="mt-2 text-xs text-muted-foreground">لا توجد جلسات بعد</p>
            </>
          )}
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">المخدومين</p>
          <p className="mt-2 text-3xl font-bold">{stats.students}</p>
          {stats.best && <p className="mt-2 text-xs text-muted-foreground">الأفضل: {stats.best.rate}% ({shortDate(stats.best.date)})</p>}
        </div>
      </div>

      {/* Attendance trend */}
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="font-bold">اتجاه الحضور <span className="font-normal text-muted-foreground">· آخر {chart.length} جلسة</span></h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />حاضر</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />غائب</span>
          </div>
        </div>
        <div className="p-4">
          {chart.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">لم يُسجَّل حضور بعد.</p>
          ) : (
            <>
              <div className="flex h-52 items-end gap-1.5">
                {chart.map((s) => (
                  <div key={s.id} className="group flex h-full flex-1 flex-col justify-end" title={`${formatDateAr(s.date)} — ${s.present}/${s.total} حاضر (${s.rate}%)`}>
                    {s.total > 0 ? (
                      <>
                        <div className="w-full rounded-t bg-rose-400 transition group-hover:bg-rose-500" style={{ height: `${100 - s.rate}%` }} />
                        <div className="w-full rounded-b bg-emerald-500 transition group-hover:bg-emerald-600" style={{ height: `${s.rate}%` }} />
                      </>
                    ) : (
                      <div className="h-full w-full rounded bg-muted" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-1.5">
                {chart.map((s) => (
                  <div key={s.id} className="flex-1 text-center text-[0.6rem] tabular-nums text-muted-foreground">{formatDateAr(s.date, { day: "numeric", month: "numeric" })}</div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sessions table */}
        <section className="rounded-lg border bg-card shadow-sm lg:col-span-2">
          <div className="border-b px-4 py-3 font-bold">الجلسات <span className="font-normal text-muted-foreground">· {sessions.length}</span></div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>حاضر</TableHead>
                  <TableHead>غائب</TableHead>
                  <TableHead>النسبة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">لا توجد جلسات بعد. ابدأ واحدة من الأعلى.</TableCell>
                  </TableRow>
                ) : (
                  [...sessions].reverse().map((s, i) => (
                    <TableRow key={s.id} className="hover:bg-muted/50">
                      <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <Link href={`/attendance/${s.id}`} className="font-bold text-primary hover:underline">{formatDateAr(s.date)}</Link>
                      </TableCell>
                      <TableCell className="font-bold text-emerald-600">{s.present}</TableCell>
                      <TableCell className="font-bold text-rose-600">{s.absent}</TableCell>
                      <TableCell><Badge tone={rateTone(s.rate)}>{s.rate}%</Badge></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/attendance/${s.id}`}>فتح</Link>
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setToDelete(s)}>
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Rankings */}
        <div className="space-y-6">
          <RankingCard title="الأكثر غيابًا" rows={topAbsent} tone="text-rose-600" />
          <RankingCard title="الأكثر حضورًا" rows={topPresent} tone="text-emerald-600" />
        </div>
      </div>

      {/* Start attendance */}
      <Dialog open={startOpen} onOpenChange={(o) => !busy && setStartOpen(o)}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>بدء جلسة</DialogTitle>
            <DialogDescription>ينشئ كشف حضور جديد لكل المخدومين في هذا التاريخ.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              open(startDate);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="start-date">التاريخ</Label>
              <Input id="start-date" type="date" dir="ltr" required value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={busy} />
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-start">
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                بدء الحضور
              </Button>
              <Button type="button" variant="outline" onClick={() => setStartOpen(false)} disabled={busy}>إلغاء</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit meeting */}
      <Dialog open={editOpen} onOpenChange={(o) => !busy && setEditOpen(o)}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>تعديل اجتماع</DialogTitle>
            <DialogDescription>تغيير النقاط يسري على الجلسات القادمة فقط.</DialogDescription>
          </DialogHeader>
          {editOpen && <MeetingForm initial={meeting} busy={busy} submitLabel="حفظ" onSubmit={update} />}
        </DialogContent>
      </Dialog>

      {/* Delete session */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !busy && !o && setToDelete(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>حذف الجلسة</DialogTitle>
            <DialogDescription>
              حذف جلسة {toDelete ? formatDateAr(toDelete.date) : ""} وسجلات الحضور الخاصة بها؟ سيتم استرجاع النقاط من {toDelete?.present} مخدوم.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-start">
            <Button variant="destructive" onClick={confirmDelete} disabled={busy}>
              {busy ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Trash2 className="ml-2 h-4 w-4" />}
              حذف
            </Button>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={busy}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RankingCard({ title, rows, tone }: { title: string; rows: RankRow[]; tone: string }) {
  return (
    <section className="rounded-lg border bg-card shadow-sm">
      <div className="border-b px-4 py-3 font-bold">{title} <span className="font-normal text-muted-foreground">· هذا الاجتماع</span></div>
      <div className="px-4 py-1">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">لا توجد بيانات بعد.</p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 border-b py-2.5 last:border-0">
              <StudentAvatar name={r.name} id={r.id} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{r.name}</span>
                <span className="block text-xs text-muted-foreground">{r.studentClass}</span>
              </span>
              <span className={cn("text-sm font-bold tabular-nums", tone)}>{r.count}<span className="mr-0.5 text-xs font-medium text-muted-foreground">×</span></span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
