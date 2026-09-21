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
import { Trash2, UserPlus } from "lucide-react";

export function ManageKhodamClient({ initialKhodam }: { initialKhodam: Khadem[] }) {
  const [khodam, setKhodam] = useState(initialKhodam);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({ name: "", username: "", password: "", role: "admin" as Khadem["role"] });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newKhadem = await addKhadem(formData);
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
      await deleteKhadem(id);
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
                <TableCell className="text-left">
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
