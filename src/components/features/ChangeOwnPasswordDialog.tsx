"use client"
import { useState } from "react"
import { KeyRound, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { SERVER_UNREACHABLE } from "@/lib/messages"
import { changeOwnPassword } from "@/app/actions/auth"

export function ChangeOwnPasswordDialog() {
  const [open, setOpen] = useState(false)
  const [currentPass, setCurrentPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass !== confirmPass) {
      toast({ variant: "destructive", title: "غير متطابقة", description: "كلمة السر الجديدة وتأكيدها مختلفان." })
      return
    }
    setBusy(true)
    const res = await changeOwnPassword(currentPass, newPass)
    setBusy(false)
    if (res?.success) {
      toast({ variant: "success", title: "تم التغيير", description: "استخدم كلمة السر الجديدة في المرة القادمة." })
      setOpen(false)
    } else {
      toast({ variant: "destructive", title: "خطأ", description: res?.error || SERVER_UNREACHABLE })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (busy) return
        setOpen(v)
        if (!v) {
          setCurrentPass("")
          setNewPass("")
          setConfirmPass("")
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="sm:flex-1">
          <KeyRound />
          تغيير كلمة السر
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تغيير كلمة السر</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cur-pass">كلمة السر الحالية</Label>
            <Input id="cur-pass" required type="password" dir="ltr" autoComplete="current-password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} disabled={busy} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-own-pass">كلمة السر الجديدة</Label>
            <Input id="new-own-pass" required type="password" dir="ltr" autoComplete="new-password" minLength={8} maxLength={64} value={newPass} onChange={(e) => setNewPass(e.target.value)} disabled={busy} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pass">تأكيد كلمة السر الجديدة</Label>
            <Input id="confirm-pass" required type="password" dir="ltr" autoComplete="new-password" minLength={8} maxLength={64} value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} disabled={busy} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : null}
            حفظ
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
