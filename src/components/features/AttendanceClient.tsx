"use client"

import { useState } from "react"
import { Student } from "@prisma/client"
import { saveAttendance } from "@/app/actions/db"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CalendarCheck, Search } from "lucide-react"

export function AttendanceClient({ students, khademName }: { students: Student[], khademName: string }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [searchQuery, setSearchQuery] = useState("")
  // Map of studentId -> isPresent (boolean)
  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.studentClass.includes(searchQuery)
  )

  const handleToggle = (studentId: string, checked: boolean) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: checked }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const records = students.map(s => ({
        studentId: s.id,
        status: attendanceState[s.id] || false
      }))
      
      const res = await saveAttendance(new Date(date), records, khademName);
      if (!res || res.error || res.success === false) {
        throw new Error(res?.error || 'Failed to save attendance');
      }
      
      toast({
        title: "تم الحفظ بنجاح",
        description: `تم حفظ غياب يوم ${date} وإضافة النقاط للحاضرين.`,
        className: "bg-success text-white"
      })
      // Reset state for safety or leave as is
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-2">
          <label className="font-bold whitespace-nowrap">تاريخ اليوم:</label>
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-48"
          />
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث عن مخدوم..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700">
          {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <CalendarCheck className="h-4 w-4 ml-2" />}
          حفظ الغياب
        </Button>
      </div>

      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">الفصل</TableHead>
              <TableHead className="text-center w-32">حاضر؟</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-bold">{s.name}</TableCell>
                <TableCell>{s.studentClass}</TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center items-center h-full">
                    <Switch 
                      checked={attendanceState[s.id] || false} 
                      onCheckedChange={(checked) => handleToggle(s.id, checked)}
                      className={attendanceState[s.id] ? "bg-success" : ""}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredStudents.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  لا يوجد نتائج
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
