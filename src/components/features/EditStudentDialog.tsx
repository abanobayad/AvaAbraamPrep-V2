"use client"
import { useState, useEffect } from "react"
import { Student } from "@prisma/client"
import { updateStudent } from "@/app/actions/db"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Edit2 } from "lucide-react"

export function EditStudentDialog({ student, onUpdated }: { student: Student, onUpdated: (s: Student) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: student.name,
    studentClass: student.studentClass,
    phone: student.phone || "",
    address: student.address || "",
    notes: student.notes || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateStudent(student.id, formData);
        if (!res || res.error || res.success === false) {
          throw new Error(res?.error || 'Failed to update student');
        }
        const updated = res.data || res;
      toast({ title: "تم التعديل", description: "تم تعديل بيانات المخدوم بنجاح", className: "bg-success text-white" });
      onUpdated(updated);
      setOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-2 border-primary/20 hover:bg-primary/5">
          <Edit2 className="h-4 w-4 ml-2" /> تعديل البيانات
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل بيانات: {student.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>الاسم</Label>
            <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>الفصل</Label>
            <Select value={formData.studentClass} onValueChange={v => setFormData({...formData, studentClass: v})}>
              <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="أولى إعدادي">أولى إعدادي</SelectItem>
                <SelectItem value="ثانية إعدادي">ثانية إعدادي</SelectItem>
                <SelectItem value="ثالثة إعدادي">ثالثة إعدادي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>رقم الموبايل</Label>
            <Input dir="ltr" className="text-right" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>العنوان</Label>
            <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            حفظ التعديلات
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
