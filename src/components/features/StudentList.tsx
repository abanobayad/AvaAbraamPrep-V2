"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, ChevronLeft, FileSpreadsheet, UserPlus } from "lucide-react"
import { getStudents } from "@/app/actions/db"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Chips } from "@/components/ui/chips"
import { List, ListButton, ListSkeleton, EmptyState } from "@/components/ui/list"
import { useToast } from "@/components/ui/use-toast"
import { SERVER_UNREACHABLE } from "@/lib/messages"
import { CLASSES } from "@/config/classes"
import { StudentSheet, type StudentRow } from "./StudentSheet"

type ClassFilter = "الكل" | (typeof CLASSES)[number]

const FILTERS: { value: ClassFilter; label: string }[] = [
  { value: "الكل", label: "الكل" },
  ...CLASSES.map((c) => ({ value: c, label: c })),
]

export function StudentList() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [cls, setCls] = useState<ClassFilter>("الكل")
  const [selected, setSelected] = useState<StudentRow | null>(null)
  const { toast } = useToast()

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await getStudents()
      if (res?.success) setStudents(res.data)
      else toast({ variant: "destructive", title: "خطأ", description: res?.error || SERVER_UNREACHABLE })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
    const handleRefresh = () => fetchStudents()
    window.addEventListener("refresh-students", handleRefresh)
    return () => window.removeEventListener("refresh-students", handleRefresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim()
    return students
      .filter((s) => cls === "الكل" || s.studentClass === cls)
      .filter((s) => !q || s.name.includes(q) || (s.studentCode ?? "").includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, "ar"))
  }, [students, query, cls])

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast({ variant: "destructive", title: "لا يوجد ما يُصدَّر", description: "القائمة الحالية فارغة." })
      return
    }
    const esc = (v: string | null | undefined) => `"${(v ?? "").replace(/"/g, '""')}"`
    const rows = [
      ["الاسم", "الفصل", "الكود", "رقم الموبايل", "العنوان", "الملاحظات"].join(","),
      ...filtered.map((s) => [s.name, s.studentClass, s.studentCode ?? "", s.phone, s.address, s.notes].map(esc).join(",")),
    ]
    const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `كشف_${cls}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute end-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالاسم أو الكود"
          aria-label="بحث"
          className="pe-11"
        />
      </div>

      <Chips value={cls} onChange={setCls} options={FILTERS} label="الفصل" />

      {loading ? (
        <ListSkeleton rows={6} />
      ) : students.length === 0 ? (
        <EmptyState
          title="لا يوجد مخدومين بعد"
          hint="ابدأ بإضافة أول مخدوم وسيظهر هنا."
          action={
            <Button asChild variant="secondary">
              <Link href="/add-student">
                <UserPlus />
                إضافة مخدوم
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="لا توجد نتائج" hint="جرّب اسمًا آخر أو غيّر الفصل." />
      ) : (
        <>
          <p className="px-1 text-sm text-muted-foreground">
            <span className="num">{filtered.length}</span> مخدوم
          </p>
          <List>
            {filtered.map((s) => (
              <ListButton key={s.id} onClick={() => setSelected(s)}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.name}</span>
                  <span className="block text-sm text-muted-foreground">{s.studentClass}</span>
                </span>
                <span className="num text-sm text-muted-foreground">{s.studentCode}</span>
                <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground/60" />
              </ListButton>
            ))}
          </List>
          <Button variant="outline" className="w-full" onClick={exportCsv}>
            <FileSpreadsheet />
            تصدير الكشف الحالي (CSV)
          </Button>
        </>
      )}

      <StudentSheet
        student={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onUpdated={(u) => {
          setStudents((prev) => prev.map((s) => (s.id === u.id ? { ...s, ...u } : s)))
          setSelected((cur) => (cur && cur.id === u.id ? { ...cur, ...u } : cur))
        }}
        onDeleted={(id) => {
          setStudents((prev) => prev.filter((s) => s.id !== id))
          setSelected(null)
        }}
      />
    </div>
  )
}
