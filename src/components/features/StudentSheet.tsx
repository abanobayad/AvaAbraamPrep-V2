"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Phone, MapPin, StickyNote, KeyRound, Copy, Pencil, Trash2 } from "lucide-react"
import { updateStudent, deleteStudent } from "@/app/actions/db"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { SERVER_UNREACHABLE } from "@/lib/messages"
import { CLASSES } from "@/config/classes"

export type StudentRow = {
  id: string
  name: string
  studentClass: string
  studentCode: string | null
  phone: string | null
  address: string | null
  notes: string | null
  totalPoints: number
}

type Mode = "view" | "edit" | "delete"

/**
 * One sheet per student: details first, then editing or deleting inside the
 * same sheet instead of stacking dialogs.
 */
export function StudentSheet({
  student,
  onOpenChange,
  onUpdated,
  onDeleted,
}: {
  student: StudentRow | null
  onOpenChange: (open: boolean) => void
  onUpdated: (s: StudentRow) => void
  onDeleted: (id: string) => void
}) {
  const [mode, setMode] = useState<Mode>("view")
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: "", studentClass: "", phone: "", address: "", notes: "" })
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (student) {
      setMode("view")
      setForm({
        name: student.name,
        studentClass: student.studentClass,
        phone: student.phone ?? "",
        address: student.address ?? "",
        notes: student.notes ?? "",
      })
    }
  }, [student])

  if (!student) return null

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await updateStudent(student.id, form)
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE)
      onUpdated({ ...student, ...res.data })
      router.refresh()
      toast({ variant: "success", title: "تم الحفظ", description: "تم تعديل بيانات المخدوم." })
      setMode("view")
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      const res = await deleteStudent(student.id)
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE)
      onDeleted(student.id)
      router.refresh()
      toast({ title: "تم الحذف", description: `تم حذف ${student.name} وكل نقاطه.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message })
    } finally {
      setBusy(false)
    }
  }

  const copyCode = async () => {
    if (!student.studentCode) return
    await navigator.clipboard.writeText(student.studentCode)
    toast({ title: "تم النسخ", description: "كود الدخول في الحافظة." })
  }

  return (
    <Dialog open={!!student} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{student.name}</DialogTitle>
          <DialogDescription>
            {student.studentClass} · <span className="num">{student.totalPoints}</span> نقطة
          </DialogDescription>
        </DialogHeader>

        {mode === "view" && (
          <div className="space-y-5">
            <dl className="divide-y rounded-xl border">
              <div className="flex items-center gap-3 px-4 py-3">
                <KeyRound className="h-5 w-5 shrink-0 text-muted-foreground" />
                <dt className="text-sm text-muted-foreground">كود الدخول</dt>
                <dd className="num ms-auto text-lg font-semibold tracking-wider">{student.studentCode ?? "—"}</dd>
                <Button variant="ghost" size="icon-sm" onClick={copyCode} aria-label="نسخ الكود" disabled={!student.studentCode}>
                  <Copy />
                </Button>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <Phone className="h-5 w-5 shrink-0 text-muted-foreground" />
                <dt className="text-sm text-muted-foreground">الموبايل</dt>
                <dd className="ms-auto">
                  {student.phone ? (
                    <a href={`tel:${student.phone}`} className="num font-medium text-primary underline-offset-4 hover:underline">
                      {student.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <dt className="text-sm text-muted-foreground">العنوان</dt>
                <dd className="ms-auto text-end">{student.address || <span className="text-muted-foreground">—</span>}</dd>
              </div>
              {student.notes ? (
                <div className="flex items-start gap-3 px-4 py-3">
                  <StickyNote className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <dt className="text-sm text-muted-foreground">ملاحظات</dt>
                  <dd className="ms-auto text-end text-sm">{student.notes}</dd>
                </div>
              ) : null}
            </dl>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" className="flex-1" onClick={() => setMode("edit")}>
                <Pencil />
                تعديل البيانات
              </Button>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setMode("delete")}>
                <Trash2 />
                حذف
              </Button>
            </div>
          </div>
        )}

        {mode === "edit" && (
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-name">الاسم</Label>
              <Input id="s-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label>الفصل</Label>
              <Select value={form.studentClass} onValueChange={(v) => setForm({ ...form, studentClass: v })} disabled={busy}>
                <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-phone">رقم الموبايل</Label>
              <Input id="s-phone" inputMode="tel" dir="ltr" className="num" maxLength={11} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-address">العنوان</Label>
              <Input id="s-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-notes">ملاحظات</Label>
              <Textarea id="s-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={busy} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="flex-1" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : null}
                حفظ
              </Button>
              <Button type="button" variant="ghost" onClick={() => setMode("view")} disabled={busy}>
                رجوع
              </Button>
            </div>
          </form>
        )}

        {mode === "delete" && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">
              سيتم حذف <span className="font-semibold">{student.name}</span> نهائيًا مع كل نقاطه وسجله. لا يمكن التراجع.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="destructive" className="flex-1" onClick={remove} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
                حذف نهائي
              </Button>
              <Button variant="ghost" onClick={() => setMode("view")} disabled={busy}>
                رجوع
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
