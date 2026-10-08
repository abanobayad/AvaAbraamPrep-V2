"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, KeyRound, Trash2, Copy, Check, Loader2, ChevronLeft } from "lucide-react"
import { addKhadem, deleteKhadem } from "@/app/actions/db"
import { resetKhademPassword } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { List, ListButton, EmptyState } from "@/components/ui/list"
import { useToast } from "@/components/ui/use-toast"
import { SERVER_UNREACHABLE } from "@/lib/messages"

type KhademRow = { id: string; name: string; username: string; role: string }
type Mode = "actions" | "password" | "delete"

function generatePassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join("")
}

export function ManageKhodamClient({ initialKhodam, currentUserId }: { initialKhodam: KhademRow[]; currentUserId: string }) {
  const [khodam, setKhodam] = useState<KhademRow[]>(initialKhodam)
  useEffect(() => setKhodam(initialKhodam), [initialKhodam])

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "admin" })
  const [selected, setSelected] = useState<KhademRow | null>(null)
  const [mode, setMode] = useState<Mode>("actions")
  const [newPass, setNewPass] = useState("")
  const [savedPass, setSavedPass] = useState("")
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const openRow = (k: KhademRow) => {
    setSelected(k)
    setMode("actions")
    setNewPass("")
    setSavedPass("")
    setCopied(false)
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await addKhadem(form)
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE)
      setKhodam((prev) => [...prev, res.data])
      router.refresh()
      setAddOpen(false)
      setForm({ name: "", username: "", password: "", role: "admin" })
      toast({ variant: "success", title: "تمت الإضافة", description: `${res.data.name} أصبح خادمًا.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "لم تتم الإضافة", description: err.message })
    } finally {
      setBusy(false)
    }
  }

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setBusy(true)
    try {
      const res = await resetKhademPassword(selected.id, newPass)
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE)
      setSavedPass(newPass)
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!selected) return
    setBusy(true)
    try {
      const res = await deleteKhadem(selected.id)
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE)
      setKhodam((prev) => prev.filter((k) => k.id !== selected.id))
      router.refresh()
      setSelected(null)
      toast({ title: "تم الحذف", description: `تم حذف حساب ${selected.name}.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message })
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(savedPass)
    setCopied(true)
  }

  const roleLabel = (r: string) => (r === "superadmin" ? "سوبر أدمن" : "خادم")

  return (
    <div className="space-y-4">
      <Button className="w-full sm:w-auto" onClick={() => setAddOpen(true)}>
        <UserPlus />
        إضافة خادم
      </Button>

      {khodam.length === 0 ? (
        <EmptyState title="لا يوجد خدام بعد" />
      ) : (
        <List>
          {khodam.map((k) => (
            <ListButton key={k.id} onClick={() => openRow(k)}>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {k.name}
                  {k.id === currentUserId ? <span className="ms-2 text-xs text-muted-foreground">(أنت)</span> : null}
                </span>
                <span className="num block text-sm text-muted-foreground">{k.username}</span>
              </span>
              <span className="text-sm text-muted-foreground">{roleLabel(k.role)}</span>
              <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground/60" />
            </ListButton>
          ))}
        </List>
      )}

      <Dialog open={addOpen} onOpenChange={(o) => !busy && setAddOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة خادم</DialogTitle>
          </DialogHeader>
          <form onSubmit={add} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="k-name">الاسم</Label>
              <Input id="k-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="k-username">اسم المستخدم</Label>
              <Input id="k-username" required dir="ltr" autoComplete="off" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="k-password">كلمة المرور</Label>
              <div className="flex gap-2">
                <Input id="k-password" required dir="ltr" autoComplete="new-password" minLength={8} maxLength={64} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} disabled={busy} />
                <Button type="button" variant="secondary" onClick={() => setForm({ ...form, password: generatePassword() })} disabled={busy}>توليد</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>الصلاحية</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })} disabled={busy}>
                <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">خادم</SelectItem>
                  <SelectItem value="superadmin">سوبر أدمن</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              إضافة
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(o) => !busy && !o && setSelected(null)}>
        <DialogContent>
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>
                  <span className="num">{selected.username}</span> · {roleLabel(selected.role)}
                </DialogDescription>
              </DialogHeader>

              {mode === "actions" && (
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" onClick={() => setMode("password")} disabled={selected.role === "superadmin"}>
                    <KeyRound />
                    تغيير كلمة السر
                  </Button>
                  {selected.role === "superadmin" ? (
                    <p className="text-center text-xs text-muted-foreground">السوبر أدمن يغير كلمة سره من حسابه.</p>
                  ) : null}
                  <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setMode("delete")} disabled={selected.id === currentUserId}>
                    <Trash2 />
                    حذف الحساب
                  </Button>
                </div>
              )}

              {mode === "password" && (savedPass ? (
                <div className="space-y-4">
                  <div className="rounded-xl border bg-card p-4 text-center">
                    <p className="text-sm text-muted-foreground">كلمة السر الجديدة. لن تظهر مرة أخرى.</p>
                    <p className="num mt-2 select-all text-2xl font-semibold tracking-wider">{savedPass}</p>
                    <Button variant="secondary" className="mt-3" onClick={copy}>
                      {copied ? <Check /> : <Copy />}
                      {copied ? "تم النسخ" : "نسخ"}
                    </Button>
                  </div>
                  <Button variant="ghost" className="w-full" onClick={() => setSelected(null)}>تم</Button>
                </div>
              ) : (
                <form onSubmit={resetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-pass">كلمة السر الجديدة</Label>
                    <div className="flex gap-2">
                      <Input id="new-pass" required dir="ltr" autoComplete="new-password" minLength={8} maxLength={64} value={newPass} onChange={(e) => setNewPass(e.target.value)} disabled={busy} />
                      <Button type="button" variant="secondary" onClick={() => setNewPass(generatePassword())} disabled={busy}>توليد</Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="submit" className="flex-1" disabled={busy}>
                      {busy ? <Loader2 className="animate-spin" /> : null}
                      حفظ
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setMode("actions")} disabled={busy}>رجوع</Button>
                  </div>
                </form>
              ))}

              {mode === "delete" && (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed">
                    سيتم حذف حساب <span className="font-semibold">{selected.name}</span> ولن يستطيع الدخول بعدها.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="destructive" className="flex-1" onClick={remove} disabled={busy}>
                      {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
                      حذف الحساب
                    </Button>
                    <Button variant="ghost" onClick={() => setMode("actions")} disabled={busy}>رجوع</Button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
