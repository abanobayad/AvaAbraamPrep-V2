"use client"
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CLASSES } from "@/config/classes";
import { MEETING_TYPES, DAYS, DAY_LABELS, FREQUENCIES, parseSchedule, type DayName, type Frequency, type MeetingLike } from "@/config/meetings";
import type { MeetingInput } from "@/app/actions/meetings";

export type MeetingFormInitial = MeetingLike & {
  title: string;
  category: string;
  points: number;
  studentClass: string | null;
  notes: string | null;
};

type DayRow = { on: boolean; begin: string; end: string };
const ALL = "الكل";

function scheduleRows(initial?: MeetingFormInitial | null): Record<DayName, DayRow> {
  const parsed = initial && initial.frequency === "daily" ? parseSchedule(initial.schedule) : {};
  return Object.fromEntries(
    DAYS.map((d) => {
      const slot = parsed[d];
      return [d, slot ? { on: true, begin: slot.begin, end: slot.end ?? "" } : { on: false, begin: "", end: "" }];
    })
  ) as Record<DayName, DayRow>;
}

/** Create / edit form of a meeting: type and points, weekly day + time or a daily schedule. */
export function MeetingForm({
  initial,
  busy,
  submitLabel,
  onSubmit,
}: {
  initial?: MeetingFormInitial | null;
  busy: boolean;
  submitLabel: string;
  onSubmit: (input: MeetingInput) => Promise<void>;
}) {
  const [category, setCategory] = useState(initial?.category ?? "MASS");
  const [title, setTitle] = useState(initial?.title ?? "حضور قداس");
  const [points, setPoints] = useState<number | "">(initial?.points ?? 100);
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency === "daily" ? "daily" : "weekly");
  const [day, setDay] = useState<string>(initial && initial.frequency !== "daily" && initial.day ? initial.day : "");
  const [startTime, setStartTime] = useState(initial && initial.frequency !== "daily" ? initial.startTime ?? "" : "");
  const [endTime, setEndTime] = useState(initial && initial.frequency !== "daily" ? initial.endTime ?? "" : "");
  const [schedule, setSchedule] = useState<Record<DayName, DayRow>>(() => scheduleRows(initial));
  const [studentClass, setStudentClass] = useState(initial?.studentClass ?? ALL);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const pickType = (key: string) => {
    const t = MEETING_TYPES.find((x) => x.key === key);
    if (!t) return;
    setCategory(key);
    if (!initial) {
      setTitle(key === "OTHER" ? "" : t.label);
      setPoints(t.points);
    }
  };

  const setRow = (d: DayName, patch: Partial<DayRow>) => setSchedule((prev) => ({ ...prev, [d]: { ...prev[d], ...patch } }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title,
      category,
      points: Number(points),
      frequency,
      day: day || null,
      startTime: startTime || null,
      endTime: endTime || null,
      schedule: Object.fromEntries(DAYS.map((d) => [d, { on: schedule[d].on, begin: schedule[d].begin, end: schedule[d].end }])),
      studentClass: studentClass === ALL ? null : studentClass,
      notes,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>النوع</Label>
          <Select value={category} onValueChange={pickType} disabled={busy}>
            <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MEETING_TYPES.map((t) => (
                <SelectItem key={t.key} value={t.key}>{t.label} (+{t.points})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>العنوان</Label>
          <Input required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: اجتماع الجمعة" disabled={busy} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>نوع الاجتماع</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FREQUENCIES.map((f) => {
            const on = frequency === f.key;
            return (
              <label
                key={f.key}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                  on ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50",
                  busy && "pointer-events-none opacity-60"
                )}
              >
                <input type="radio" name="frequency" value={f.key} className="sr-only" checked={on} onChange={() => setFrequency(f.key)} disabled={busy} />
                <span className="text-xl" aria-hidden>{f.icon}</span>
                <span>
                  <span className="block text-sm font-bold">{f.label}</span>
                  <span className="block text-xs text-muted-foreground">{f.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {frequency === "weekly" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>اليوم</Label>
            <Select value={day} onValueChange={setDay} disabled={busy}>
              <SelectTrigger dir="rtl"><SelectValue placeholder="-- اختر اليوم --" /></SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>{DAY_LABELS[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>البداية</Label>
              <Input type="time" dir="ltr" required value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label>النهاية <span className="text-xs text-muted-foreground">(اختياري)</span></Label>
              <Input type="time" dir="ltr" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={busy} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>مواعيد الأسبوع</Label>
          <div className="overflow-hidden rounded-xl border">
            {DAYS.map((d) => {
              const row = schedule[d];
              return (
                <div key={d} className={cn("flex flex-wrap items-center gap-2 border-b px-3 py-2 last:border-b-0", row.on ? "bg-primary/5" : "bg-card")}>
                  <label className="flex min-w-[6.5rem] items-center gap-2 text-sm font-bold">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-[hsl(var(--primary))]"
                      checked={row.on}
                      onChange={(e) => setRow(d, { on: e.target.checked })}
                      disabled={busy}
                    />
                    {DAY_LABELS[d]}
                  </label>
                  <div className="flex flex-1 items-center gap-2">
                    <Input type="time" dir="ltr" className="h-9" value={row.begin} onChange={(e) => setRow(d, { begin: e.target.value })} disabled={busy || !row.on} aria-label={`${DAY_LABELS[d]} · البداية`} />
                    <span className="text-muted-foreground">–</span>
                    <Input type="time" dir="ltr" className="h-9" value={row.end} onChange={(e) => setRow(d, { end: e.target.value })} disabled={busy || !row.on} aria-label={`${DAY_LABELS[d]} · النهاية`} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">علّم الأيام التي يُقام فيها واكتب ميعاد كل يوم. وقت النهاية اختياري.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>نقاط الحضور</Label>
          <Input type="number" dir="ltr" min={0} max={1000} step={1} required value={points} onChange={(e) => setPoints(e.target.value === "" ? "" : Number(e.target.value))} disabled={busy} />
          <p className="text-xs text-muted-foreground">النقاط التي يحصل عليها كل مخدوم حاضر على اللوحة في كل جلسة (0 = لا شيء).</p>
        </div>
        <div className="space-y-2">
          <Label>المرحلة</Label>
          <Select value={studentClass} onValueChange={setStudentClass} disabled={busy}>
            <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>كل المراحل</SelectItem>
              {CLASSES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>ملاحظات (اختياري)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={busy} rows={2} />
      </div>

      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
