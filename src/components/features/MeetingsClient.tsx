"use client"
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Loader2, Trash2, Pencil, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { SERVER_UNREACHABLE } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { DAY_LABELS, meetingTypeLabel, isDaily, slots, formatTime, formatDateAr, type DayName } from "@/config/meetings";
import { createMeeting, updateMeeting, deleteMeeting, type MeetingInput } from "@/app/actions/meetings";
import { MeetingForm } from "./MeetingForm";

export type MeetingRow = {
  id: string;
  title: string;
  category: string;
  points: number;
  frequency: string;
  day: string | null;
  startTime: string | null;
  endTime: string | null;
  schedule: string | null;
  studentClass: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  lastSession: string | null;
  _count: { sessions: number };
};

export function Badge({ tone = "slate", className, children }: { tone?: "slate" | "accent" | "success" | "amber" | "danger"; className?: string; children: React.ReactNode }) {
  const tones = {
    slate: "bg-muted text-muted-foreground",
    accent: "bg-emerald-100 text-emerald-800",
    success: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-800",
  };
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", tones[tone], className)}>{children}</span>;
}

/** Day badge of a meeting: "⛪ يومي" for a daily one, the weekday otherwise. */
export function DayBadge({ meeting }: { meeting: MeetingRow }) {
  return isDaily(meeting) ? <Badge tone="accent">⛪ يومي</Badge> : <Badge>{meeting.day ? DAY_LABELS[meeting.day as DayName] : "—"}</Badge>;
}

export function MeetingsClient({ initialMeetings }: { initialMeetings: MeetingRow[] }) {
  const [meetings, setMeetings] = useState<MeetingRow[]>(initialMeetings);
  useEffect(() => setMeetings(initialMeetings), [initialMeetings]);

  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MeetingRow | null>(null);
  const [toDelete, setToDelete] = useState<MeetingRow | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const visible = useMemo(() => {
    const q = query.trim();
    return q ? meetings.filter((m) => m.title.includes(q) || meetingTypeLabel(m.category).includes(q)) : meetings;
  }, [meetings, query]);

  const create = async (input: MeetingInput) => {
    setBusy(true);
    try {
      const res = await createMeeting(input);
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE);
      setMeetings((prev) => [...prev, res.data]);
      setCreateOpen(false);
      toast({ title: "تم إنشاء الاجتماع", description: "ابدأ الحضور من صفحة الاجتماع", className: "bg-success text-white" });
      router.push(`/meetings/${res.data.id}`);
      router.refresh();
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
    } finally {
      setBusy(false);
    }
  };

  const update = async (input: MeetingInput) => {
    if (!editing) return;
    setBusy(true);
    try {
      const res = await updateMeeting(editing.id, input);
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE);
      setMeetings((prev) => prev.map((m) => (m.id === editing.id ? res.data : m)));
      setEditing(null);
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
      const res = await deleteMeeting(toDelete.id);
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE);
      setMeetings((prev) => prev.filter((m) => m.id !== toDelete.id));
      router.refresh();
      toast({ title: "تم حذف الاجتماع", description: res.data?.reversed ? `تم استرجاع النقاط من ${res.data.reversed} تسجيل حضور.` : undefined });
      setToDelete(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث" aria-label="بحث" className="pr-9" />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة اجتماع
        </Button>
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => !busy && setCreateOpen(o)}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>إضافة اجتماع</DialogTitle>
            <DialogDescription>اختر النوع وسيتم ضبط العنوان والنقاط تلقائيًا، ويمكنك تعديلها.</DialogDescription>
          </DialogHeader>
          <MeetingForm busy={busy} submitLabel="إنشاء" onSubmit={create} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !busy && !o && setEditing(null)}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>تعديل اجتماع</DialogTitle>
            <DialogDescription>تغيير النقاط يسري على الجلسات القادمة فقط.</DialogDescription>
          </DialogHeader>
          {editing && <MeetingForm key={editing.id} initial={editing} busy={busy} submitLabel="حفظ" onSubmit={update} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!toDelete} onOpenChange={(o) => !busy && !o && setToDelete(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>حذف الاجتماع</DialogTitle>
            <DialogDescription>
              حذف «{toDelete?.title}» وكل جلسات الحضور الخاصة به ({toDelete?._count.sessions} جلسة)؟ سيتم استرجاع النقاط التي منحها.
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

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-bold">كل الاجتماعات <span className="font-normal text-muted-foreground">· {meetings.length}</span></h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>اليوم</TableHead>
                <TableHead>البداية</TableHead>
                <TableHead>النهاية</TableHead>
                <TableHead className="text-center">نقاط الحضور</TableHead>
                <TableHead className="text-center">الجلسات</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    {meetings.length === 0 ? "لا توجد اجتماعات بعد. أضف اجتماعًا لبدء تسجيل الحضور." : "لا نتائج"}
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((m, i) => {
                  const held = slots(m);
                  const daily = isDaily(m);
                  return (
                    <TableRow key={m.id} className="hover:bg-muted/50">
                      <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <Link href={`/meetings/${m.id}`} className="font-bold text-primary hover:underline">{m.title}</Link>
                        <div className="text-xs text-muted-foreground">
                          {meetingTypeLabel(m.category)} · {m.studentClass ?? "كل المراحل"}
                        </div>
                      </TableCell>
                      <TableCell><DayBadge meeting={m} /></TableCell>
                      {daily ? (
                        <TableCell colSpan={2} className="text-xs text-muted-foreground">
                          {(Object.keys(held) as DayName[]).map((d, idx, arr) => (
                            <span key={d} className="whitespace-nowrap">
                              {DAY_LABELS[d]} <span className="tabular-nums">{formatTime(held[d]!.begin)}</span>
                              {idx < arr.length - 1 && " · "}
                            </span>
                          ))}
                        </TableCell>
                      ) : (
                        <>
                          <TableCell className="tabular-nums">{formatTime(m.startTime)}</TableCell>
                          <TableCell className="tabular-nums">{formatTime(m.endTime) || "—"}</TableCell>
                        </>
                      )}
                      <TableCell className="text-center">
                        <Badge tone={m.points > 0 ? "accent" : "slate"}><span dir="ltr">+{m.points}</span></Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold">{m._count.sessions}</span>
                        {m.lastSession && <div className="text-[11px] text-muted-foreground">آخرها {formatDateAr(m.lastSession, { day: "numeric", month: "short" })}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/meetings/${m.id}`}><Eye className="ml-1 h-4 w-4" />عرض</Link>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditing(m)}><Pencil className="ml-1 h-4 w-4" />تعديل</Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setToDelete(m)}>
                            <Trash2 className="ml-1 h-4 w-4" />حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
