"use client"
import { EFTEQAD_ENABLED } from "@/lib/features";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCcw, Phone, MapPin, FileText, Trash2, Loader2, Search, KeyRound, Award } from "lucide-react"
import { Student } from "@prisma/client"
import { getStudents, deleteStudent } from "@/app/actions/db"
import { EditStudentDialog } from "./EditStudentDialog"
import { EfteqadHistoryDialog } from "./EfteqadHistoryDialog"
import { useToast } from "@/components/ui/use-toast"
import { SERVER_UNREACHABLE } from "@/lib/messages";
import { CLASSES } from "@/config/classes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const ALL = "الكل";

/** Loosens Arabic matching: hamza forms, taa marbuta / haa, alef maqsura / yaa, tatweel and diacritics. */
function normalizeArabic(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

function DetailRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <Icon className="h-4 w-4 shrink-0 mt-1 text-primary" />
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="flex-1 font-medium">{children}</span>
    </div>
  );
}

export function StudentList({ role = "student" }: { role?: string }) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [classFilter, setClassFilter] = useState<string>(ALL)
  const [selected, setSelected] = useState<Student | null>(null)
  const { toast } = useToast();
  const router = useRouter();

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState<string>("")
  const [deleting, setDeleting] = useState(false)

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await getStudents();
      if (res?.success) {
        setStudents(res.data);
      } else {
        toast({ variant: "destructive", title: "خطأ", description: res?.error || SERVER_UNREACHABLE });
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
    const handleRefresh = () => fetchStudents()
    window.addEventListener("refresh-students", handleRefresh)
    return () => window.removeEventListener("refresh-students", handleRefresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Declared before the memo below, which reads it while filtering.
  const canManage = role !== "student";

  // Search by name or login code, within the selected grade tab.
  const visible = useMemo(() => {
    const q = normalizeArabic(query);
    const matches = (s: Student) => {
      if (!q) return true;
      if (normalizeArabic(s.name ?? "").includes(q)) return true;
      return canManage && (s.studentCode ?? "").includes(q);
    };
    return students
      .filter(s => (classFilter === ALL || s.studentClass === classFilter) && matches(s))
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "ar"));
  }, [students, query, classFilter, canManage]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await deleteStudent(deleteId);
      if (!res?.success) {
        throw new Error(res?.error || SERVER_UNREACHABLE);
      }
      setStudents(prev => prev.filter(s => s.id !== deleteId));
      setSelected(null);
      router.refresh();
      toast({ title: "تم الحذف", description: "تم حذف الطالب بنجاح", className: "bg-success text-white" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">قائمة الطلاب</h2>
        <Button variant="outline" onClick={fetchStudents} disabled={loading}>
          <RefreshCcw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ابحث بالاسم أو كود الدخول"
          aria-label="بحث عن مخدوم"
          className="pr-9"
        />
      </div>

      <Tabs value={classFilter} onValueChange={setClassFilter}>
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value={ALL} className="py-2">الكل</TabsTrigger>
          {CLASSES.map(c => (
            <TabsTrigger key={c} value={c} className="py-2">{c}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {!loading && students.length > 0 && (
        <p className="text-sm text-muted-foreground">
          <span dir="ltr">{visible.length}</span> من <span dir="ltr">{students.length}</span> مخدوم
        </p>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && !deleting && setDeleteId(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف {deleteName}؟ سيتم حذف كل نقاطه وبياناته نهائياً.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-start">
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Trash2 className="h-4 w-4 ml-2" />}
              حذف نهائي
            </Button>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full details of the clicked row */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent dir="rtl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>{selected.studentClass}</DialogDescription>
              </DialogHeader>
              <div className="text-sm">
                {canManage && (
                  <DetailRow icon={KeyRound} label="كود الدخول">
                    <span className="font-bold text-primary tracking-widest" dir="ltr">{selected.studentCode}</span>
                  </DetailRow>
                )}
                <DetailRow icon={Award} label="النقاط">
                  <span dir="ltr">{selected.totalPoints}</span>
                </DetailRow>
                <DetailRow icon={Phone} label="رقم الموبايل">
                  {selected.phone ? <a href={`tel:${selected.phone}`} className="text-primary hover:underline" dir="ltr">{selected.phone}</a> : <span className="text-muted-foreground">—</span>}
                </DetailRow>
                <DetailRow icon={MapPin} label="العنوان">
                  {selected.address || <span className="text-muted-foreground">—</span>}
                </DetailRow>
                <DetailRow icon={FileText} label="ملاحظات">
                  {selected.notes || <span className="text-muted-foreground">—</span>}
                </DetailRow>
              </div>
              {canManage && (
                <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-start">
                  <EditStudentDialog
                    student={selected}
                    onUpdated={(updated) => {
                      setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
                      setSelected(prev => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
                    }}
                  />
                  {EFTEQAD_ENABLED && <EfteqadHistoryDialog studentId={selected.id} studentName={selected.name} />}
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => { setDeleteId(selected.id); setDeleteName(selected.name); }}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {loading ? (
        <Card className="animate-pulse h-48 bg-muted/50 border-0" />
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-card">
          لا يوجد طلاب مسجلين حتى الآن
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-card">
          لا توجد نتائج مطابقة للبحث
        </div>
      ) : (
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead className="w-40 text-center">كود الدخول</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((student, index) => (
                <TableRow
                  key={student.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelected(student)}
                  title="اضغط لعرض التفاصيل"
                >
                  <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-bold">
                    {student.name}
                    {classFilter === ALL && (
                      <span className="mr-2 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {student.studentClass}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-bold text-primary tracking-widest" dir="ltr">
                    {canManage ? student.studentCode : "•••••"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
