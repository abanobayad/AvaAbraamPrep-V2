"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { KeyRound, Loader2 } from "lucide-react";
import { changeOwnPassword } from "@/app/actions/auth";

export function ChangeOwnPasswordDialog() {
  const [open, setOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      toast({ variant: "destructive", title: "خطأ", description: "كلمة السر الجديدة غير متطابقة" });
      return;
    }
    setLoading(true);
    const res = await changeOwnPassword(currentPass, newPass);
    setLoading(false);
    if (res?.success) {
      toast({ title: "نجاح", description: "تم تغيير كلمة السر بنجاح", className: "bg-success text-white" });
      setOpen(false);
    } else {
      toast({ variant: "destructive", title: "خطأ", description: res?.error });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) { setCurrentPass(""); setNewPass(""); setConfirmPass(""); }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <KeyRound className="h-4 w-4 ml-2" /> تغيير كلمة السر
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تغيير كلمة السر</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>كلمة السر الحالية</Label>
            <Input required type="password" dir="ltr" value={currentPass} onChange={e => setCurrentPass(e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>كلمة السر الجديدة</Label>
            <Input required type="password" dir="ltr" value={newPass} onChange={e => setNewPass(e.target.value)} disabled={loading} minLength={8} maxLength={64} />
          </div>
          <div className="space-y-2">
            <Label>تأكيد كلمة السر الجديدة</Label>
            <Input required type="password" dir="ltr" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} disabled={loading} minLength={8} maxLength={64} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            حفظ
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
