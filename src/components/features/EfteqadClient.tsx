"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Download, PhoneCall } from "lucide-react"
import { logEfteqad } from "@/app/actions/db"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { List, ListItem, EmptyState } from "@/components/ui/list"
import { useToast } from "@/components/ui/use-toast"
import { SERVER_UNREACHABLE } from "@/lib/messages"
import { csvCell } from "@/lib/csv"
import { EfteqadHistoryDialog } from "./EfteqadHistoryDialog"

type Row = { id: string; name: string; studentClass: string; phone: string | null; address: string | null; notes: string | null }

export function EfteqadClient({ students: initial, khademName }: { students: Row[]; khademName: string }) {
  const [students, setStudents] = useState<Row[]>(initial)
  const [target, setTarget] = useState<Row | null>(null)
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const exportCsv = () => {
    const rows = [
      ["الاسم", "الفصل", "رقم الموبايل", "العنوان", "ملاحظات"].join(","),
      ...students.map((s) => [s.name, s.studentClass, s.phone, s.address, s.notes].map(csvCell).join(",")),
    ]
    const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `كشف_الافتقاد_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const submit = async () => {
    if (!target) return
    setBusy(true)
    try {
      const res = await logEfteqad(target.id, khademName, notes)
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE)
      setStudents((prev) => prev.filter((s) => s.id !== target.id))
      router.refresh()
      toast({ variant: "success", title: "تم التسجيل", description: `تم افتقاد ${target.name}.` })
      setTarget(null)
      setNotes("")
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {students.length === 0 ? (
        <EmptyState title="لا يوجد من يحتاج افتقادًا الآن" />
      ) : (
        <>
          <List>
            {students.map((s) => (
              <ListItem key={s.id} className="flex-wrap">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {s.studentClass}
                    {s.phone ? (
                      <>
                        {" · "}
                        <a href={`tel:${s.phone}`} className="num text-primary">{s.phone}</a>
                      </>
                    ) : null}
                  </span>
                </span>
                <EfteqadHistoryDialog studentId={s.id} studentName={s.name} />
                <Button size="sm" onClick={() => setTarget(s)}>
                  <PhoneCall />
                  تسجيل افتقاد
                </Button>
              </ListItem>
            ))}
          </List>
          <Button variant="outline" className="w-full" onClick={exportCsv}>
            <Download />
            تصدير الكشف (CSV)
          </Button>
        </>
      )}

      <Dialog open={!!target} onOpenChange={(o) => !busy && !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>افتقاد {target?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ef-notes">ملاحظات <span className="font-normal text-muted-foreground">(اختياري)</span></Label>
              <Textarea id="ef-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مثال: تم الاتصال واعتذر بسبب المرض" disabled={busy} />
            </div>
            <Button className="w-full" onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
