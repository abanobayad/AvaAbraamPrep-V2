"use client"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModeToggle } from "@/components/mode-toggle"
import { handleLogin, loginStudent } from "@/app/actions/auth"
import { useToast } from "@/components/ui/use-toast"
import { SERVER_UNREACHABLE } from "@/lib/messages"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [studentLoading, setStudentLoading] = useState(false)
  const { toast } = useToast()

  // A successful login redirects, so the action resolves with no result.
  // If we are still on the login page a moment later, the server never answered properly.
  const failIfStillHere = (setBusy: (busy: boolean) => void) => {
    window.setTimeout(() => {
      if (window.location.pathname === "/") {
        toast({ variant: "destructive", title: "خطأ", description: SERVER_UNREACHABLE })
        setBusy(false)
      }
    }, 4000)
  }

  const onAdminSubmit = async (formData: FormData) => {
    setLoading(true)
    const result = await handleLogin(formData)
    if (result?.error) {
      toast({ variant: "destructive", title: "خطأ", description: result.error })
      setLoading(false)
    } else if (!result) {
      failIfStillHere(setLoading)
    }
  }

  const onStudentSubmit = async (formData: FormData) => {
    setStudentLoading(true)
    const result = await loginStudent(formData)
    if (result?.error) {
      toast({ variant: "destructive", title: "خطأ", description: result.error })
      setStudentLoading(false)
    } else if (!result) {
      failIfStillHere(setStudentLoading)
    }
  }

  return (
    <div className="min-h-dvh">
      <div className="absolute left-2 top-2">
        <ModeToggle />
      </div>

      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-12">
        <header className="mb-8">
          <p className="text-sm font-medium text-primary">أسرة مارمينا والبابا كيرلس</p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight">نظام نقاط مرحلة إعدادي</h1>
        </header>

        <Tabs defaultValue="student">
          <TabsList>
            <TabsTrigger value="student">المخدومين</TabsTrigger>
            <TabsTrigger value="admin">الخدام</TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <form action={onStudentSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="code">كودك المكون من 5 أرقام</Label>
                <Input
                  id="code"
                  name="code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={5}
                  required
                  dir="ltr"
                  placeholder="• • • • •"
                  className="num h-14 text-center text-2xl font-semibold tracking-[0.4em]"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={studentLoading}>
                {studentLoading ? <Loader2 className="animate-spin" /> : null}
                دخول
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="admin">
            <form action={onAdminSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input id="username" name="username" autoComplete="username" required dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required dir="ltr" />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : null}
                دخول
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
