"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
      <div className="flex flex-col items-center text-destructive">
        <AlertCircle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold">حدث خطأ غير متوقع</h2>
      </div>
      <p className="text-muted-foreground text-center max-w-md">
        نعتذر، لقد واجهنا مشكلة أثناء تحميل هذه الصفحة. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          إعادة المحاولة
        </Button>
        <Button onClick={() => window.location.href = '/'} variant="outline">
          الصفحة الرئيسية
        </Button>
      </div>
    </div>
  )
}
