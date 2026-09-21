"use client"

import { useState } from "react"
import { getEfteqadHistory } from "@/app/actions/db"
import { EfteqadLog } from "@prisma/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { History, Loader2, Calendar } from "lucide-react"

export function EfteqadHistoryDialog({ studentId, studentName }: { studentId: string, studentName: string }) {
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState<EfteqadLog[]>([])
  const [loading, setLoading] = useState(false)

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setLoading(true)
      try {
        const history = await getEfteqadHistory(studentId)
        setLogs(history)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-border">
          <History className="h-4 w-4 ml-2" />
          سجل الافتقاد
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>سجل افتقاد: {studentName}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              لم يتم تسجيل أي افتقاد سابق لهذا المخدوم.
            </div>
          ) : (
            <div className="relative border-r-2 border-border pr-6 space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="relative">
                  <div className="absolute -right-[31px] top-1 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-background" />
                  <div className="bg-card p-4 rounded-xl border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-primary">{log.khademName}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.date).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                    {log.notes ? (
                      <p className="text-sm text-foreground bg-muted/30 p-2 rounded">{log.notes}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">بدون ملاحظات</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
