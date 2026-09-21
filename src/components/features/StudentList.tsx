"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCcw, User, Phone, MapPin, FileText, QrCode } from "lucide-react"
import { Student } from "@prisma/client"
import { QRCodeSVG } from "qrcode.react"
import { getStudents } from "@/app/actions/db"
import { EditStudentDialog } from "./EditStudentDialog"
import { EfteqadHistoryDialog } from "./EfteqadHistoryDialog"

export function StudentList({ role = "student" }: { role?: string }) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const data = await getStudents()
      setStudents(data)
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

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">كشف الأولاد والـ QR Codes</h2>
        <Button variant="outline" onClick={fetchStudents} disabled={loading}>
          <RefreshCcw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

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
          {students.map(student => {
            const attendanceUrl = `https://attendance-system.local/?studentId=${student.id}`
            
            return (
              <Card key={student.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="bg-primary/5 p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <h3 className="font-bold text-lg">{student.name}</h3>
                    </div>
                    <span className="inline-block mt-2 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {student.studentClass}
                    </span>
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
                    
                    <div className="mt-4 pt-4 border-t border-border flex flex-col items-center gap-3">
                      <div className="bg-white p-2 border rounded-xl shadow-sm">
                        <QRCodeSVG value={attendanceUrl} size={100} />
                      </div>
                      <a href={attendanceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <QrCode className="h-3 w-3" />
                        رابط الحضور المباشر
                      </a>

                      {role !== "student" && (
                        <div className="w-full mt-2 pt-3 border-t border-border/50 flex flex-col items-center">
                          <div className="bg-white p-2 rounded-lg shadow-sm mb-2">
                            <QRCodeSVG value={student.id} size={80} />
                          </div>
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
                            <EfteqadHistoryDialog studentId={student.id} studentName={student.name} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
