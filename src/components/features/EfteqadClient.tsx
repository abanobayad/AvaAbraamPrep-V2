"use client"

import { useState } from "react"
import { useRouter } from "next/navigation";
import { Student } from "@prisma/client"
import { logEfteqad } from "@/app/actions/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { SERVER_UNREACHABLE } from "@/lib/messages";
import { csvCell } from "@/lib/csv"
import { Loader2, Download, PhoneCall, History, HeartHandshake } from "lucide-react"
import { EfteqadHistoryDialog } from "./EfteqadHistoryDialog"

export function EfteqadClient({ students: initialStudents, khademName }: { students: Student[], khademName: string }) {
  const [students, setStudents] = useState(initialStudents)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [openDialogId, setOpenDialogId] = useState<string | null>(null)
  const { toast } = useToast();
  const router = useRouter();

  const handleExportCSV = () => {
    const headers = ["الاسم", "الفصل", "رقم الموبايل", "العنوان", "ملاحظات"]
    const rows = students.map(s => [s.name, s.studentClass, s.phone || "لا يوجد", s.address || "لا يوجد", s.notes].map(csvCell))

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `كشف_الافتقاد_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSubmit = async (studentId: string) => {
    setLoadingId(studentId)
    try {
      const res = await logEfteqad(studentId, khademName, notes);
      if (!res?.success) {
        throw new Error(res?.error || SERVER_UNREACHABLE);
      }
      setStudents(students.filter(s => s.id !== studentId)); router.refresh();
      toast({
        title: "تم التسجيل",
        description: "تم تسجيل الافتقاد وإزالة المخدوم من القائمة.",
        className: "bg-success text-white"
      })
      setOpenDialogId(null)
      setNotes("")
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleExportCSV} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
          <Download className="h-4 w-4 ml-2" />
          تصدير كشف الافتقاد (CSV)
        </Button>
      </div>

      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">الفصل</TableHead>
              <TableHead className="text-right">الموبايل</TableHead>
              <TableHead className="text-center w-64">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-bold">{s.name}</TableCell>
                <TableCell>{s.studentClass}</TableCell>
                <TableCell dir="ltr" className="text-right">{s.phone || "-"}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <EfteqadHistoryDialog studentId={s.id} studentName={s.name} />

                    <Dialog open={openDialogId === s.id} onOpenChange={(isOpen) => setOpenDialogId(isOpen ? s.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          <PhoneCall className="h-4 w-4 ml-2" />
                          تسجيل افتقاد
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>تسجيل افتقاد للمخدوم: {s.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">ملاحظات الافتقاد (اختياري)</label>
                            <Textarea 
                              placeholder="اكتب نتيجة الافتقاد (مثال: تم الاتصال واعتذر بسبب المرض)"
                              value={notes}
                              onChange={e => setNotes(e.target.value)}
                            />
                          </div>
                          <Button 
                            onClick={() => handleSubmit(s.id)} 
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            disabled={loadingId === s.id}
                          >
                            {loadingId === s.id && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                            حفظ الافتقاد
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                  <HeartHandshake className="h-12 w-12 mx-auto text-emerald-200 mb-4" />
                  رائع! لا يوجد طلاب يحتاجون لافتقاد حالياً.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
