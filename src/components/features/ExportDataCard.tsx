"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Loader2 } from "lucide-react"
import { getStudents } from "@/app/actions/db"
import { useToast } from "@/components/ui/use-toast"

export function ExportDataCard() {
  const [loading, setLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState("الكل")
  const { toast } = useToast()

  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await getStudents(selectedClass);
        if (!res.success) throw new Error(res.error);
        const students = res.data;
        if (students.length === 0) {
        toast({ variant: "destructive", title: "تنبيه", description: "لا يوجد طلاب في هذا الفصل للتصدير" })
        return
      }

      const headers = ["الاسم", "الفصل", "رقم الموبايل", "العنوان", "الملاحظات"]
      const csvRows = [headers.join(",")]
      students.forEach((s: any) => {
        const row = [
          `"${s.name}"`,
          `"${s.studentClass}"`,
          `"${s.phone || ""}"`,
          `"${s.address || ""}"`,
          `"${s.notes || ""}"`
        ]
        csvRows.push(row.join(","))
      })

      const csvString = csvRows.join("\n")
      // UTF-8 BOM to ensure Excel reads Arabic correctly
      const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement("a")
      link.href = url
      link.download = `كشف_${selectedClass}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({ variant: "default", className: "bg-success text-white", title: "تم بنجاح", description: "تم تحميل الكشف بنجاح" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "حدث خطأ", description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>تحميل كشف الأسماء</CardTitle>
        <CardDescription>تصدير بيانات الطلاب إلى ملف Excel/CSV</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>الفصل المراد تصديره</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger dir="rtl">
              <SelectValue placeholder="اختر الفصل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="الكل">الكل</SelectItem>
              <SelectItem value="أولى إعدادي">أولى إعدادي</SelectItem>
              <SelectItem value="تانية إعدادي">تانية إعدادي</SelectItem>
              <SelectItem value="تالتة إعدادي">تالتة إعدادي</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="success" onClick={handleExport} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <FileSpreadsheet className="h-4 w-4 ml-2" />}
          تصدير إلى Excel
        </Button>
      </CardContent>
    </Card>
  )
}
