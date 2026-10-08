"use client"
import { useEffect, useState } from "react"
import { getStudentHistory } from "@/app/actions/db"
import { cn } from "@/lib/utils"

type Tx = { id: string; actionName: string; pointsChanged: number; addedBy: string; timestamp: string }

/** Plain list of point changes, newest first. Lives inside whichever sheet needs it. */
export function TransactionHistoryList({ studentId }: { studentId: string }) {
  const [items, setItems] = useState<Tx[] | null>(null)

  useEffect(() => {
    let alive = true
    setItems(null)
    getStudentHistory(studentId).then((res) => {
      if (alive) setItems(res?.success ? res.data : [])
    })
    return () => {
      alive = false
    }
  }, [studentId])

  if (items === null) {
    return (
      <ul className="divide-y rounded-xl border" aria-busy>
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
            <div className="ms-auto h-4 w-8 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
    )
  }

  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">لا توجد حركات بعد.</p>
  }

  return (
    <ul className="max-h-[50dvh] divide-y overflow-y-auto rounded-xl border">
      {items.map((tx) => (
        <li key={tx.id} className="flex items-center gap-3 px-4 py-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{tx.actionName}</span>
            <span className="block text-xs text-muted-foreground">
              {new Date(tx.timestamp).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })} · {tx.addedBy}
            </span>
          </span>
          <span className={cn("num text-base font-semibold", tx.pointsChanged > 0 ? "text-success" : "text-destructive")}>
            {tx.pointsChanged > 0 ? `+${tx.pointsChanged}` : tx.pointsChanged}
          </span>
        </li>
      ))}
    </ul>
  )
}
