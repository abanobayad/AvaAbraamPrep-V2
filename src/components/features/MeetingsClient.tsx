"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, Plus, Loader2, Trash2, Users, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { SERVER_UNREACHABLE } from "@/lib/messages";
import { CLASSES } from "@/config/classes";
import { MEETING_TYPES, meetingTypeLabel } from "@/config/meetings";
import { createMeeting, deleteMeeting } from "@/app/actions/meetings";

export type MeetingRow = {
  id: string;
  title: string;
  category: string;
  points: number;
  date: string;
  studentClass: string | null;
  notes: string | null;
  createdBy: string;
  _count: { attendances: number };
};

const ALL = "الكل";

function today() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function MeetingsClient({ initialMeetings }: { initialMeetings: MeetingRow[] }) {
  const [meetings, setMeetings] = useState<MeetingRow[]>(initialMeetings);
  useEffect(() => setMeetings(initialMeetings), [initialMeetings]);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ category: "MASS", title: "حضور قداس", points: 100, date: today(), studentClass: ALL, notes: "" });
  const [toDelete, setToDelete] = useState<MeetingRow | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const pickType = (key: string) => {
    const t = MEETING_TYPES.find((x) => x.key === key);
    if (!t) return;
    setForm((f) => ({ ...f, category: key, title: key === "OTHER" ? "" : t.label, points: t.points }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await createMeeting({
        title: form.title,
        category: form.category,
        points: Number(form.points),
        date: form.date,
        studentClass: form.studentClass === ALL ? null : form.studentClass,
        notes: form.notes,
      });
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE);
      setMeetings((prev) => [res.data, ...prev]);
      router.refresh();
      setOpen(false);
      toast({ title: "تم إنشاء الاجتماع", description: "افتحه الآن لتسجيل الحضور", className: "bg-success text-white" });
      router.push(`/meetings/${res.data.id}`);
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
      toast({ title: "تم الحذف", description: "تم حذف الاجتماع واسترجاع نقاطه" });
      setToDelete(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              اجتماع جديد
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>اجتماع جديد</DialogTitle>
              <DialogDescription>اختر النوع وسيتم ضبط النقاط تلقائيًا، ويمكنك تعديلها.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select value={form.category} onValueChange={pickType} disabled={busy}>
                  <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map((t) => (
                      <SelectItem key={t.key} value={t.key}>{t.label} (+{t.points})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>اسم الاجتماع</Label>
                <Input required maxLength={100} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: قداس الجمعة" disabled={busy} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>النقاط لكل حاضر</Label>
                  <Input type="number" dir="ltr" min={1} max={200} required value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} disabled={busy} />
                </div>
                <div className="space-y-2">
                  <Label>التاريخ</Label>
                  <Input type="date" dir="ltr" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} disabled={busy} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>المرحلة</Label>
                <Select value={form.studentClass} onValueChange={(v) => setForm({ ...form, studentClass: v })} disabled={busy}>
                  <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>كل المراحل</SelectItem>
                    {CLASSES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ملاحظات (اختياري)</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={busy} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <CalendarCheck className="h-4 w-4 ml-2" />}
                إنشاء وتسجيل الحضور
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!toDelete} onOpenChange={(o) => !busy && !o && setToDelete(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>حذف الاجتماع</DialogTitle>
            <DialogDescription>
              سيتم حذف {toDelete?.title} واسترجاع النقاط من كل من حضره ({toDelete?._count.attendances} مخدوم).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-start">
            <Button variant="destructive" onClick={confirmDelete} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Trash2 className="h-4 w-4 ml-2" />}
              حذف
            </Button>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={busy}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {meetings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-card">
          لا توجد اجتماعات بعد. أنشئ أول اجتماع لتسجيل الحضور.
        </div>
      ) : (
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاجتماع</TableHead>
                <TableHead className="w-32">التاريخ</TableHead>
                <TableHead className="w-32">المرحلة</TableHead>
                <TableHead className="w-24 text-center">النقاط</TableHead>
                <TableHead className="w-24 text-center">الحضور</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((m) => (
                <TableRow key={m.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/meetings/${m.id}`} className="font-bold text-primary hover:underline">
                      {m.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">{meetingTypeLabel(m.category)}</div>
                  </TableCell>
                  <TableCell dir="ltr" className="text-right">{new Date(m.date).toLocaleDateString("ar-EG")}</TableCell>
                  <TableCell>{m.studentClass ?? "كل المراحل"}</TableCell>
                  <TableCell className="text-center font-bold text-success" dir="ltr">+{m.points}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1"><Users className="h-4 w-4 text-muted-foreground" />{m._count.attendances}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/meetings/${m.id}`}>
                          الحضور
                          <ChevronLeft className="h-4 w-4 mr-1" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setToDelete(m)} aria-label="حذف">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
