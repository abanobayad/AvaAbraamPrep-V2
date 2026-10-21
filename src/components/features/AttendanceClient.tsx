"use client"
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Save, Loader2, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { SERVER_UNREACHABLE } from "@/lib/messages";
import { CLASSES } from "@/config/classes";
import { saveAttendance } from "@/app/actions/meetings";

type StudentRow = { id: string; name: string; studentClass: string; studentCode: string | null };
const ALL = "الكل";

export function AttendanceClient({
  meetingId,
  points,
  students,
  initialPresentIds,
  showClass,
}: {
  meetingId: string;
  points: number;
  students: StudentRow[];
  initialPresentIds: string[];
  showClass: boolean;
}) {
  const [present, setPresent] = useState<Set<string>>(() => new Set(initialPresentIds));
  const [saved, setSaved] = useState<Set<string>>(() => new Set(initialPresentIds));
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState(ALL);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const visible = useMemo(() => {
    const q = query.trim();
    return students.filter((s) => (classFilter === ALL || s.studentClass === classFilter) && (!q || s.name.includes(q)));
  }, [students, query, classFilter]);

  const dirty = useMemo(() => {
    if (present.size !== saved.size) return true;
    for (const id of Array.from(present)) if (!saved.has(id)) return true;
    return false;
  }, [present, saved]);

  const toggle = (id: string) => {
    setPresent((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const setAllVisible = (value: boolean) => {
    setPresent((prev) => {
      const next = new Set(prev);
      for (const s of visible) value ? next.add(s.id) : next.delete(s.id);
      return next;
    });
  };

  const save = async () => {
    setBusy(true);
    try {
      const res = await saveAttendance(meetingId, Array.from(present));
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE);
      setSaved(new Set(present));
      router.refresh();
      const { added, removed } = res.data;
      toast({
        title: "تم حفظ الحضور",
        description: `أُضيفت ${points} نقطة لـ ${added} مخدوم${removed ? ` وتم استرجاعها من ${removed}` : ""}.`,
        className: "bg-success text-white",
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "لم يتم الحفظ", description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-muted-foreground">
          الحاضرون: <span className="font-bold text-foreground" dir="ltr">{present.size}</span> من <span dir="ltr">{students.length}</span>
          {dirty && <span className="mr-2 text-xs text-amber-600">(تغييرات غير محفوظة)</span>}
        </p>
        <Button onClick={save} disabled={busy || !dirty}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
          حفظ الحضور وإضافة النقاط
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بالاسم" aria-label="بحث" className="pr-9" />
      </div>

      {showClass && (
        <Tabs value={classFilter} onValueChange={setClassFilter}>
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value={ALL} className="py-2">الكل</TabsTrigger>
            {CLASSES.map((c) => (
              <TabsTrigger key={c} value={c} className="py-2">{c}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setAllVisible(true)} disabled={busy || visible.length === 0}>
          <CheckSquare className="h-4 w-4 ml-2" />
          تحديد الكل
        </Button>
        <Button variant="outline" size="sm" onClick={() => setAllVisible(false)} disabled={busy || visible.length === 0}>
          <Square className="h-4 w-4 ml-2" />
          إلغاء التحديد
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-card">لا يوجد مخدومين</div>
      ) : (
        <ul className="bg-card rounded-lg border shadow-sm divide-y">
          {visible.map((s) => {
            const checked = present.has(s.id);
            return (
              <li key={s.id}>
                <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${checked ? "bg-success/10" : "hover:bg-muted/50"}`}>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[hsl(var(--success))] cursor-pointer"
                    checked={checked}
                    onChange={() => toggle(s.id)}
                    disabled={busy}
                  />
                  <span className="flex-1 font-bold">{s.name}</span>
                  {showClass && <span className="text-xs text-muted-foreground">{s.studentClass}</span>}
                  {checked && <span className="text-xs font-bold text-success" dir="ltr">+{points}</span>}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
