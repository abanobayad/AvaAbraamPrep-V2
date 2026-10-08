"use client"
import { useMemo, useState } from "react"
import Link from "next/link"
import { History, PlaySquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { List, ListItem } from "@/components/ui/list"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { TransactionHistoryList } from "./TransactionHistoryList"

type Row = { id: string; name: string; studentClass: string; totalPoints: number }
type Me = { id: string; name: string; totalPoints: number; updatedAt?: string | null }

export function StudentPortalClient({ me, fallbackName, students }: { me: Me | null; fallbackName: string; students: Row[] }) {
  const [historyOpen, setHistoryOpen] = useState(false)

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

  const mine = me ? ranked.find((s) => s.id === me.id) : undefined
  const points = me?.totalPoints ?? 0

  return (
    <div className="space-y-8">
      <section className="text-center">
        <p className="text-sm text-muted-foreground">أهلاً، {me?.name || fallbackName}</p>
        <p className={cn("num mt-2 text-6xl font-bold leading-none tracking-tight", points < 0 ? "text-destructive" : "text-foreground")}>{points}</p>
        <p className="mt-2 text-sm text-muted-foreground">نقطة</p>
        {mine ? (
          <p className="mt-4 text-base">
            ترتيبك <span className="num font-semibold">{mine.rank}</span> من <span className="num font-semibold">{ranked.length}</span>
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {me ? (
            <Button variant="secondary" onClick={() => setHistoryOpen(true)}>
              <History />
              سجل نقاطي
            </Button>
          ) : null}
          <Button variant="outline" asChild>
            <Link href="/media">
              <PlaySquare />
              الميديا
            </Link>
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="px-1 text-sm font-medium text-muted-foreground">لوحة الشرف · كل الفصول</h2>
        <List>
          {ranked.map((s) => {
            const isMe = me?.id === s.id
            return (
              <ListItem key={s.id} className={cn(isMe && "bg-primary/10")}>
                <span className={cn("num w-7 shrink-0 text-center text-sm", s.rank <= 3 ? "font-semibold text-foreground" : "text-muted-foreground")}>{s.rank}</span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate", isMe ? "font-semibold" : "font-medium")}>
                    {s.name}
                    {isMe ? <span className="ms-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">أنت</span> : null}
                  </span>
                  <span className="block text-sm text-muted-foreground">{s.studentClass}</span>
                </span>
                <span className={cn("num text-lg font-semibold", s.totalPoints < 0 ? "text-destructive" : "text-foreground")}>{s.totalPoints}</span>
              </ListItem>
            )
          })}
        </List>
      </section>

      {me ? (
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>سجل نقاطي</DialogTitle>
            </DialogHeader>
            <TransactionHistoryList studentId={me.id} />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}
