export const dynamic = 'force-dynamic';
"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { handleLogin, loginStudent } from "@/app/actions/auth"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [studentLoading, setStudentLoading] = useState(false)
  const { toast } = useToast()

  const onAdminSubmit = async (formData: FormData) => {
    setLoading(true)
    const result = await handleLogin(formData)
    if (result?.error) {
      toast({ variant: "destructive", title: "خطأ", description: result.error })
      setLoading(false)
    }
  }

  const onStudentSubmit = async (formData: FormData) => {
    setStudentLoading(true)
    const result = await loginStudent(formData)
    if (result?.error) {
      toast({ variant: "destructive", title: "خطأ", description: result.error })
      setStudentLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 px-4 text-center">
      <div className="space-y-4">
        <h1 className="text-3xl md:text-5xl font-black text-primary leading-tight">
          أسرة مارمينا والبابا كيرلس
          <br />
          <span className="text-secondary">مرحلة إعدادي</span>
        </h1>
        <p className="text-lg text-muted-foreground font-medium">نظام إدارة الحضور والنقاط</p>
      </div>

      <Tabs defaultValue="student" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="student" className="text-base">دخول المخدومين</TabsTrigger>
          <TabsTrigger value="admin" className="text-base">دخول الخدام</TabsTrigger>
        </TabsList>
        
        <TabsContent value="student">
          <Card className="shadow-xl border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-primary">أهلاً بك!</CardTitle>
              <CardDescription>أدخل الكود السري الخاص بك لتعرف نقاطك ومكافآتك</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={onStudentSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-lg">كود المخدوم (5 أرقام)</Label>
                  <Input 
                    id="code" 
                    name="code" 
                    placeholder="مثال: 49201" 
                    required 
                    dir="ltr" 
                    className="text-center text-2xl tracking-widest font-bold h-14"
                    maxLength={5}
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-lg" disabled={studentLoading}>
                  {studentLoading ? <Loader2 className="h-5 w-5 animate-spin ml-2" /> : null}
                  تسجيل الدخول
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card className="shadow-xl border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-primary">دخول الخدام</CardTitle>
              <CardDescription>أدخل بيانات الحساب الخاص بك</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={onAdminSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input id="username" name="username" placeholder="أدخل اسم المستخدم" required dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input id="password" name="password" type="password" placeholder="أدخل كلمة المرور" required dir="ltr" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                  دخول
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
