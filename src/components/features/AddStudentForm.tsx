"use client"
import { useState } from "react"
import Link from "next/link"
import { Loader2, Copy, Check } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { SERVER_UNREACHABLE } from "@/lib/messages"
import { CLASSES } from "@/config/classes"
import { addStudent } from "@/app/actions/db"

const EMPTY = { name: "", studentClass: "", phone: "", address: "", notes: "" }

export function AddStudentForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [created, setCreated] = useState<{ name: string; studentCode: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const validate = () => {
    if (!form.name.trim()) return "الاسم مطلوب"
    if (!/^[؀-ۿ\s]+$/.test(form.name.trim())) return "الاسم بالحروف العربية فقط"
    if (!form.studentClass) return "اختر الفصل"
    if (form.phone && !/^[0-9]{0,11}$/.test(form.phone)) return "رقم الموبايل أرقام إنجليزية فقط، 11 رقمًا كحد أقصى"
    return null
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const error = validate()
    if (error) {
      toast({ variant: "destructive", title: "راجع البيانات", description: error })
      return
    }
    setLoading(true)
    try {
      const res = await addStudent(form)
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE)
      setCreated({ name: res.data.name, studentCode: res.data.studentCode })
      setForm(EMPTY)
      setCopied(false)
      window.dispatchEvent(new Event("refresh-students"))
    } catch (err: any) {
      toast({ variant: "destructive", title: "لم يتم الحفظ", description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!created) return
    await navigator.clipboard.writeText(created.studentCode)
    setCopied(true)
  }

  if (created) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">تم تسجيل</p>
          <p className="mt-1 text-xl font-semibold">{created.name}</p>
          <p className="mt-5 text-sm text-muted-foreground">كود الدخول</p>
          <p className="num mt-1 text-4xl font-bold tracking-[0.3em] text-primary">{created.studentCode}</p>
          <Button variant="secondary" className="mt-4" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "تم النسخ" : "نسخ الكود"}
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">أعطِ هذا الكود للمخدوم ليدخل به.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => setCreated(null)}>إضافة مخدوم آخر</Button>
          <Button variant="outline" asChild>
            <Link href="/students-list">عرض الكشوفات</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">اسم المخدوم</Label>
        <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم بالعربية" autoComplete="off" required disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label>الفصل</Label>
        <Select value={form.studentClass} onValueChange={(v) => setForm({ ...form, studentClass: v })} disabled={loading}>
          <SelectTrigger dir="rtl"><SelectValue placeholder="اختر الفصل" /></SelectTrigger>
          <SelectContent>
            {CLASSES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">رقم الموبايل <span className="font-normal text-muted-foreground">(اختياري)</span></Label>
        <Input id="phone" inputMode="tel" dir="ltr" className="num" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01012345678" maxLength={11} disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">العنوان <span className="font-normal text-muted-foreground">(اختياري)</span></Label>
        <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">ملاحظات <span className="font-normal text-muted-foreground">(اختياري)</span></Label>
        <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={loading} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : null}
        حفظ وإصدار الكود
      </Button>
    </form>
  )
}
