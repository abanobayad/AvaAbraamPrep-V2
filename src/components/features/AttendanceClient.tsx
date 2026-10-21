"use client"
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Trophy, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { SERVER_UNREACHABLE } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { CLASSES } from "@/config/classes";
import { markAttendance } from "@/app/actions/meetings";
import { StudentAvatar } from "./StudentAvatar";

type StudentRow = { id: string; name: string; studentClass: string };
const ALL = "الكل";

/**
 * One attendance sheet: a switch per student, saved as soon as it is flipped.
 * Present students get the meeting's points at once; flipping back takes them away.
 */
export function AttendanceClient({
  sessionId,
  points,
  students,
  initialPresentIds,
  showClass,
}: {
  sessionId: string;
  points: number;
  students: StudentRow[];
  initialPresentIds: string[];
  showClass: boolean;
}) {
  const [present, setPresent] = useState<Set<string>>(() => new Set(initialPresentIds));
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [failed, setFailed] = useState<Map<string, boolean>>(() => new Map());
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState(ALL);
  const { toast } = useToast();

  const inClass = useMemo(() => students.filter((s) => classFilter === ALL || s.studentClass === classFilter), [students, classFilter]);
  const visible = useMemo(() => {
    const q = query.trim();
    return q ? inClass.filter((s) => s.name.includes(q)) : inClass;
  }, [inClass, query]);

  const presentCount = inClass.reduce((n, s) => n + (present.has(s.id) ? 1 : 0), 0);
  const total = inClass.length;
  const absentCount = total - presentCount;
  const rate = total ? Math.round((presentCount / total) * 100) : 0;

  const mutate = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, fn: (draft: T) => void, clone: (v: T) => T) =>
    setter((prev) => {
      const next = clone(prev);
      fn(next);
      return next;
    });
  const cloneSet = (s: Set<string>) => new Set(s);
  const cloneMap = (m: Map<string, boolean>) => new Map(m);

  const toggle = async (id: string, next: boolean) => {
    mutate(setPresent, (d) => (next ? d.add(id) : d.delete(id)), cloneSet);
    mutate(setPending, (d) => d.add(id), cloneSet);
    mutate(setFailed, (d) => d.delete(id), cloneMap);
    try {
      const res = await markAttendance(sessionId, [id], next);
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE);
    } catch (err: any) {
      mutate(setPresent, (d) => (next ? d.delete(id) : d.add(id)), cloneSet);
      mutate(setFailed, (d) => d.set(id, next), cloneMap);
      toast({ variant: "destructive", title: "لم يُحفظ التغيير", description: err.message });
    } finally {
      mutate(setPending, (d) => d.delete(id), cloneSet);
    }
  };

  const retry = () => {
    const items = Array.from(failed.entries());
    setFailed(new Map());
    for (const [id, next] of items) toggle(id, next);
  };

  const sync = pending.size > 0 ? "saving" : failed.size > 0 ? "error" : "saved";

  return (
    <div className="space-y-4">
      {/* Connection / sync status */}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold",
          sync === "saved" && "border-emerald-200 bg-emerald-50 text-emerald-700",
          sync === "saving" && "border-amber-200 bg-amber-50 text-amber-700",
          sync === "error" && "border-rose-200 bg-rose-50 text-rose-700"
        )}
      >
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", sync === "saved" ? "bg-emerald-500" : sync === "saving" ? "animate-pulse bg-amber-500" : "bg-rose-500")} />
        <span className="flex-1">
          {sync === "saved" && "تم حفظ كل التغييرات"}
          {sync === "saving" && "جارٍ الحفظ…"}
          {sync === "error" && `تعذر حفظ ${failed.size} تغيير`}
        </span>
        {sync === "error" && (
          <Button size="sm" variant="outline" onClick={retry} className="h-7">
            <RefreshCw className="ml-1 h-3.5 w-3.5" />
            إعادة المحاولة
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="text-2xl font-bold text-emerald-600">{presentCount}</div>
            <div className="text-xs font-medium text-muted-foreground">حاضر</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600">{absentCount}</div>
            <div className="text-xs font-medium text-muted-foreground">غائب</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs font-medium text-muted-foreground">الإجمالي</div>
          </div>
          <div className="h-2.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-rose-100">
            <span className="block h-full rounded-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${rate}%` }} />
          </div>
        </div>
        {points > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-1 text-xs font-medium text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            كل مخدوم حاضر يحصل على <span dir="ltr" className="font-bold text-foreground">{points}</span> نقطة على اللوحة لهذه الجلسة.
            <Link href="/points-leaderboard" className="font-bold text-primary hover:underline">افتح اللوحة</Link>
          </p>
        )}
      </div>

      {/* Toolbar */}
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن مخدوم…" aria-label="بحث" className="pr-9" autoComplete="off" />
      </div>

      {/* Grade filter: the roster and the counters above cover the chosen grade only */}
      {showClass && (
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
      )}

      {/* Roster */}
      {visible.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed bg-card py-12 text-center text-muted-foreground">لا يوجد مخدومين</div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((s) => {
            const on = present.has(s.id);
            const isPending = pending.has(s.id);
            const isFailed = failed.has(s.id);
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                  on ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
                )}
              >
                <StudentAvatar name={s.name} id={s.id} size={46} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{s.name}</span>
                  <span className={cn("block text-xs font-bold", on ? "text-emerald-600" : "text-rose-600")}>
                    {on ? "حاضر" : "غائب"}
                    {showClass && <span className="mr-2 font-medium text-muted-foreground">{s.studentClass}</span>}
                    {isPending && <span className="mr-2 font-medium text-amber-600">• جارٍ الحفظ</span>}
                    {isFailed && <span className="mr-2 font-medium text-rose-600">• لم يُحفظ</span>}
                  </span>
                </span>
                <Switch
                  checked={on}
                  disabled={isPending}
                  onCheckedChange={(v) => toggle(s.id, v)}
                  aria-label={`تسجيل حضور ${s.name}`}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
