"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, History, ChevronLeft } from "lucide-react"
import { awardPoints } from "@/app/actions/db"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { List, ListButton, EmptyState } from "@/components/ui/list"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { SERVER_UNREACHABLE } from "@/lib/messages"
import { cn } from "@/lib/utils"
import { TransactionHistoryList } from "./TransactionHistoryList"

type Row = { id: string; name: string; studentClass: string; totalPoints: number }

const SPIRITUAL = [
  { label: "حضور قداس", value: 25 },
  { label: "تسبحة وعشية", value: 20 },
  { label: "طقس ألحان", value: 15 },
  { label: "مدارس الأحد", value: 15 },
  { label: "درس كتاب مقدس", value: 15 },
]
const ACTIVITY = [
  { label: "دوري كورة", value: 10 },
  { label: "دوري شطرنج", value: 15 },
  { label: "دوري بلايستيشن", value: 15 },
  { label: "دوري بينج بونج", value: 15 },
]

type Mode = "actions" | "deduct" | "history"

function Chip({ label, value, onClick, disabled, tone = "add" }: { label: string; value: number; onClick: () => void; disabled?: boolean; tone?: "add" | "deduct" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "tap inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        tone === "add" ? "border-input bg-card hover:bg-accent active:bg-accent/70" : "border-destructive/40 text-destructive hover:bg-destructive/10"
      )}
    >
      <span className={cn("num font-semibold", tone === "add" ? "text-success" : "text-destructive")}>
        {value > 0 ? `+${value}` : value}
      </span>
      {label}
    </button>
  )
}

export function PointsLeaderboardClient({ initialStudents }: { initialStudents: Row[] }) {
  const [students, setStudents] = useState<Row[]>(initialStudents)
  useEffect(() => setStudents(initialStudents), [initialStudents])

  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Row | null>(null)
  const [mode, setMode] = useState<Mode>("actions")
  const [busy, setBusy] = useState(false)
  const [deductReason, setDeductReason] = useState("")
  const [customPoints, setCustomPoints] = useState("")
  const [customReason, setCustomReason] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const ranked = useMemo(() => {
    const sorted = [...students].sort((a, b) => (b.totalPoints - a.totalPoints) || a.name.localeCompare(b.name, "ar"))
    let rank = 0
    let prev: number | null = null
    return sorted.map((s, i) => {
      if (prev === null || s.totalPoints !== prev) rank = i + 1
      prev = s.totalPoints
      return { ...s, rank }
    })
  }, [students])

  const visible = useMemo(() => {
    const q = query.trim()
    return q ? ranked.filter((s) => s.name.includes(q)) : ranked
  }, [ranked, query])

  const open = (s: Row) => {
    setSelected(s)
    setMode("actions")
    setDeductReason("")
    setCustomPoints("")
    setCustomReason("")
  }

  const award = async (points: number, reason: string, close = true) => {
    if (!selected) return
    setBusy(true)
    try {
      const res = await awardPoints(selected.id, points, reason)
      if (!res?.success) throw new Error(res?.error || SERVER_UNREACHABLE)
      const updated = res.data as Row
      setStudents((prev) => prev.map((s) => (s.id === selected.id ? { ...s, ...updated } : s)))
      setSelected((cur) => (cur ? { ...cur, totalPoints: updated.totalPoints } : cur))
      router.refresh()
      toast({
        variant: "success",
        title: points > 0 ? `+${points} لـ ${selected.name}` : `${points} لـ ${selected.name}`,
        description: reason,
      })
      if (close) setSelected(null)
    } catch (err: any) {
      toast({ variant: "destructive", title: "لم يتم الحفظ", description: err.message })
    } finally {
      setBusy(false)
    }
  }

  const submitCustom = (e: React.FormEvent) => {
    e.preventDefault()
    const pts = parseInt(customPoints, 10)
    if (!Number.isInteger(pts) || pts === 0 || !customReason.trim()) return
    award(pts, customReason.trim())
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute end-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن مخدوم" aria-label="بحث" className="pe-11" />
      </div>

      {ranked.length === 0 ? (
        <EmptyState title="لا يوجد مخدومين بعد" hint="أضف مخدومين أولًا ثم ابدأ في تسجيل النقاط." />
      ) : visible.length === 0 ? (
        <EmptyState title="لا توجد نتائج" />
      ) : (
        <List>
          {visible.map((s) => (
            <ListButton key={s.id} onClick={() => open(s)}>
              <span className="num w-7 shrink-0 text-center text-sm text-muted-foreground">{s.rank}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{s.name}</span>
                <span className="block text-sm text-muted-foreground">{s.studentClass}</span>
              </span>
              <span className={cn("num text-lg font-semibold", s.totalPoints < 0 ? "text-destructive" : "text-foreground")}>{s.totalPoints}</span>
              <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground/60" />
            </ListButton>
          ))}
        </List>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !busy && !o && setSelected(null)}>
        <DialogContent>
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>
                  {selected.studentClass} · الرصيد <span className={cn("num font-semibold", selected.totalPoints < 0 ? "text-destructive" : "text-foreground")}>{selected.totalPoints}</span>
                </DialogDescription>
              </DialogHeader>

              {mode === "actions" && (
                <div className="space-y-6">
                  <section className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">روحي</p>
                    <div className="flex flex-wrap gap-2">
                      {SPIRITUAL.map((b) => (
                        <Chip key={b.label} {...b} disabled={busy} onClick={() => award(b.value, b.label)} />
                      ))}
                    </div>
                  </section>
                  <section className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">نشاط</p>
                    <div className="flex flex-wrap gap-2">
                      {ACTIVITY.map((b) => (
                        <Chip key={b.label} {...b} disabled={busy} onClick={() => award(b.value, b.label)} />
                      ))}
                      <Chip label="خصم سلوك" value={-5} tone="deduct" disabled={busy} onClick={() => setMode("deduct")} />
                    </div>
                  </section>

                  <form onSubmit={submitCustom} className="space-y-3 border-t pt-5">
                    <p className="text-xs font-medium text-muted-foreground">قيمة مخصصة</p>
                    <div className="grid grid-cols-[6rem_1fr] gap-2">
                      <Input type="number" inputMode="numeric" dir="ltr" className="num" value={customPoints} onChange={(e) => setCustomPoints(e.target.value)} placeholder="±10" min={-100} max={100} required disabled={busy} aria-label="النقاط" />
                      <Input value={customReason} onChange={(e) => setCustomReason(e.target.value)} maxLength={100} placeholder="السبب" required disabled={busy} aria-label="السبب" />
                    </div>
                    <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
                      {busy ? <Loader2 className="animate-spin" /> : null}
                      حفظ القيمة المخصصة
                    </Button>
                  </form>

                  <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setMode("history")}>
                    <History />
                    سجل النقاط
                  </Button>
                </div>
              )}

              {mode === "deduct" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deduct-reason">سبب الخصم <span className="font-normal text-muted-foreground">(اختياري)</span></Label>
                    <Input id="deduct-reason" value={deductReason} onChange={(e) => setDeductReason(e.target.value)} maxLength={88} placeholder="مثال: شغب في الفصل" disabled={busy} />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="destructive" className="flex-1" disabled={busy} onClick={() => award(-5, deductReason.trim() ? `خصم سلوك: ${deductReason.trim()}` : "خصم سلوك")}>
                      {busy ? <Loader2 className="animate-spin" /> : null}
                      خصم 5 نقاط
                    </Button>
                    <Button variant="ghost" disabled={busy} onClick={() => setMode("actions")}>رجوع</Button>
                  </div>
                </div>
              )}

              {mode === "history" && (
                <div className="space-y-4">
                  <TransactionHistoryList studentId={selected.id} />
                  <Button variant="ghost" className="w-full" onClick={() => setMode("actions")}>رجوع</Button>
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
