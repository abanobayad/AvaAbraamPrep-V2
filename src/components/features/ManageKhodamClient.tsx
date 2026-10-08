"use client"
import { useState } from "react";
import { Khadem } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { addKhadem, deleteKhadem } from "@/app/actions/db";
import { resetKhademPassword } from "@/app/actions/auth";
import { Trash2, UserPlus, KeyRound, Copy } from "lucide-react";


function ChangePasswordDialog({ khademId, khademName }: { khademId: string, khademName: string }) {
  const [open, setOpen] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [successPass, setSuccessPass] = useState("");
  const { toast } = useToast();

  const handleGenerate = () => {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const randomArray = new Uint8Array(10);
    crypto.getRandomValues(randomArray);
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars[randomArray[i] % chars.length];
    }
    setNewPass(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await resetKhademPassword(khademId, newPass);
    setLoading(false);
    if (res?.success) {
      setSuccessPass(newPass);
    } else {
      toast({ variant: "destructive", title: "خطأ", description: res.error });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(successPass);
    toast({ title: "تم النسخ", description: "تم نسخ كلمة السر للحافظة" });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) { setNewPass(""); setSuccessPass(""); }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <KeyRound className="h-4 w-4 ml-1" /> كلمة السر
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تغيير كلمة السر: {khademName}</DialogTitle>
        </DialogHeader>
        {successPass ? (
          <div className="space-y-4">
            <div className="p-4 bg-success/10 text-success rounded-md border border-success/20">
              <p className="font-bold mb-2">تم التغيير بنجاح!</p>
              <p className="text-sm">احفظ كلمة السر دي دلوقتي، مش هتظهر تاني:</p>
              <div className="flex items-center gap-2 mt-4">
                <code className="flex-1 p-2 bg-background border rounded text-center text-lg select-all" dir="ltr">
                  {successPass}
                </code>
                <Button onClick={copyToClipboard} size="icon" variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>كلمة السر الجديدة</Label>
              <div className="flex gap-2">
                <Input required dir="ltr" value={newPass} onChange={e => setNewPass(e.target.value)} disabled={loading} minLength={8} maxLength={64} />
                <Button type="button" variant="secondary" onClick={handleGenerate} disabled={loading}>توليد تلقائي</Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>حفظ</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ManageKhodamClient({ initialKhodam }: { initialKhodam: Khadem[] }) {
  const [khodam, setKhodam] = useState(initialKhodam);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({ name: "", username: "", password: "", role: "admin" as Khadem["role"] });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await addKhadem(formData) as any;
      if (!response || response.error) {
        throw new Error(response?.error || '500 Internal Server Error (Database connection issue)');
      }
      const newKhadem = response.data;
      if (!newKhadem || !newKhadem.name) {
        throw new Error('Invalid data returned');
      }
      setKhodam([...khodam, newKhadem]);
      setIsDialogOpen(false);
      toast({ title: "تم بنجاح", description: "تم إضافة الخادم بنجاح", className: "bg-success text-white" });
      setFormData({ name: "", username: "", password: "", role: "admin" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteKhadem(id);
      if (!res || res.error || res.success === false) {
        throw new Error(res?.error || 'Failed to delete khadem');
      }
      setKhodam(khodam.filter(k => k.id !== id));
      toast({ title: "تم بنجاح", description: "تم حذف الخادم بنجاح" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 ml-2" /> إضافة خادم</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة خادم جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>اسم المستخدم</Label>
                <Input required dir="ltr" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input required type="password" dir="ltr" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>الصلاحية</Label>
                <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v as any})}>
                  <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">خادم (Admin)</SelectItem>
                    <SelectItem value="superadmin">سوبر أدمن</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">إضافة</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>اسم المستخدم</TableHead>
              <TableHead>الصلاحية</TableHead>
              <TableHead className="text-left">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {khodam.map(k => (
              <TableRow key={k.id}>
                <TableCell className="font-bold">{k.name}</TableCell>
                <TableCell dir="ltr" className="text-right">{k.username}</TableCell>
                <TableCell>{k.role === 'superadmin' ? 'سوبر أدمن' : 'خادم'}</TableCell>
                <TableCell className="text-left flex items-center justify-end gap-2">
                  <ChangePasswordDialog khademId={k.id} khademName={k.name} />
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(k.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
