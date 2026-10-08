"use client"
import { EFTEQAD_ENABLED } from "@/lib/features";
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCcw, User, Phone, MapPin, FileText, Trash2, Loader2 } from "lucide-react"
import { Student } from "@prisma/client"
import { getStudents, deleteStudent } from "@/app/actions/db"
import { EditStudentDialog } from "./EditStudentDialog"
import { EfteqadHistoryDialog } from "./EfteqadHistoryDialog"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function StudentList({ role = "student" }: { role?: string }) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState<string>("")
  const [deleting, setDeleting] = useState(false)

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await getStudents();
      if (res.success) {
        setStudents(res.data);
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
  }, [])

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await deleteStudent(deleteId);
      if (!res.success) {
        throw new Error(res.error);
      }
      setStudents(prev => prev.filter(s => s.id !== deleteId));
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

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <Card key={i} className="animate-pulse h-64 bg-muted/50 border-0" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-card">
          لا يوجد طلاب مسجلين حتى الآن
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map(student => (
            <Card key={student.id} className="overflow-hidden hover:shadow-md transition-shadow relative">
              <CardContent className="p-0">
                <div className="bg-primary/5 p-4 border-b border-border relative">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">{student.name}</h3>
                  </div>
                  <span className="inline-block mt-2 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {student.studentClass}
                  </span>
                  {role !== "student" && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 left-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setDeleteId(student.id);
                        setDeleteName(student.name);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="p-4 space-y-3 text-sm">
                  {student.phone && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0 mt-0.5" />
                      <span dir="ltr">{student.phone}</span>
                    </div>
                  )}
                  {student.address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{student.address}</span>
                    </div>
                  )}
                  {student.notes && (
                    <div className="flex items-start gap-2 text-muted-foreground bg-muted/50 p-2 rounded border border-dashed">
                      <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{student.notes}</span>
                    </div>
                  )}
                  
                  {role !== "student" && (
                    <div className="w-full mt-4 pt-4 border-t border-border flex flex-col items-center">
                      <span className="text-sm font-bold text-primary mb-2 tracking-widest bg-primary/10 px-3 py-1 rounded">
                        كود الدخول: {student.studentCode}
                      </span>
                      <div className="w-full mt-2 flex flex-col gap-2">
                        <EditStudentDialog 
                          student={student} 
                          onUpdated={(updated) => {
                            setStudents(students.map(s => s.id === updated.id ? updated : s));
                          }} 
                        />
                        {EFTEQAD_ENABLED && <EfteqadHistoryDialog studentId={student.id} studentName={student.name} />}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
