"use client"
import { useState } from "react"
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { addStudent } from "@/app/actions/db"
import { Loader2 } from "lucide-react"

export function AddStudentForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    studentClass: "",
    phone: "",
    address: "",
    notes: ""
  })

  const validate = () => {
    if (!formData.name.trim()) return "الاسم مطلوب"
    if (!/^[\u0600-\u06FF\s]+$/.test(formData.name.trim())) return "الاسم يجب أن يحتوي على حروف عربية فقط"
    if (!formData.studentClass) return "برجاء اختيار الفصل"
    if (formData.phone && !/^[0-9]{0,11}$/.test(formData.phone)) return "رقم الموبايل غير صحيح (أرقام إنجليزية فقط، أقصى طول 11)"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const error = validate()
    if (error) {
      toast({ variant: "destructive", title: "خطأ", description: error })
      return
    }

    setLoading(true)
    try {
      const response = await addStudent(formData) as any;
      if (!response?.success) {
        throw new Error(response?.error || "حدث خطأ في قاعدة البيانات (500)");
      }
      toast({ variant: "default", className: "bg-success text-white", title: "تم بنجاح", description: "تمت إضافة المخدوم بنجاح" })
      setFormData({ name: "", studentClass: "", phone: "", address: "", notes: "" });
        router.refresh();
      // Fire custom event to refresh list
      window.dispatchEvent(new Event("refresh-students"))
    } catch (err: any) {
      toast({ variant: "destructive", title: "حدث خطأ", description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>إضافة مخدوم جديد</CardTitle>
        <CardDescription>أدخل بيانات الطالب لإضافته للنظام</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">👤 اسم المخدوم *</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="أدخل الاسم بالعربية" />
          </div>
          <div className="space-y-2">
            <Label>🏫 الفصل *</Label>
            <Select value={formData.studentClass} onValueChange={v => setFormData({...formData, studentClass: v})}>
              <SelectTrigger dir="rtl">
                <SelectValue placeholder="اختر الفصل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="أولى إعدادي">أولى إعدادي</SelectItem>
                <SelectItem value="تانية إعدادي">تانية إعدادي</SelectItem>
                <SelectItem value="تالتة إعدادي">تالتة إعدادي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">📱 رقم الموبايل</Label>
            <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="مثال: 01012345678" maxLength={11} dir="ltr" className="text-right" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">📍 العنوان</Label>
            <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="العنوان بالتفصيل" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">📝 ملاحظات إضافية</Label>
            <Textarea id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="أي ملاحظات..." />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
            حفظ البيانات
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
