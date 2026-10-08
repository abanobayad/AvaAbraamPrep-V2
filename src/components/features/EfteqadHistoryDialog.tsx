"use client"

import { useState } from "react"
import { History, Loader2 } from "lucide-react"
import { getEfteqadHistory } from "@/app/actions/db"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Log = { id: string; date: string; khademName: string; notes: string | null }

export function EfteqadHistoryDialog({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(false)

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) return
    setLoading(true)
    try {
      const res = await getEfteqadHistory(studentId)
      setLogs(res?.success ? res.data : [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`سجل افتقاد ${studentName}`}>
          <History />
          السجل
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>سجل افتقاد {studentName}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : logs.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">لم يُسجَّل افتقاد سابق.</p>
        ) : (
          <ul className="max-h-[50dvh] divide-y overflow-y-auto rounded-xl border">
            {logs.map((log) => (
              <li key={log.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{log.khademName}</span>
                  <span className="text-xs text-muted-foreground">{new Date(log.date).toLocaleDateString("ar-EG")}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{log.notes || "بدون ملاحظات"}</p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
