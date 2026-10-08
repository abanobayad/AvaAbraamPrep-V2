import Link from "next/link"
import { UserPlus, Users, Award, PlaySquare, Shield, HeartHandshake, LogOut, ChevronLeft } from "lucide-react"
import type { UserSession } from "@/services/auth"
import { EFTEQAD_ENABLED } from "@/lib/features"
import { handleLogout } from "@/app/actions/auth"
import { ChangeOwnPasswordDialog } from "@/components/features/ChangeOwnPasswordDialog"

type Row = { href: string; label: string; hint?: string; icon: React.ComponentType<{ className?: string }> }

function NavRow({ href, label, hint, icon: Icon }: Row) {
  return (
    <li>
      <Link
        href={href}
        className="tap flex min-h-16 items-center gap-4 px-4 py-3 transition-colors duration-150 hover:bg-accent/60 active:bg-accent"
      >
        <Icon className="h-6 w-6 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-medium">{label}</span>
          {hint ? <span className="block text-sm text-muted-foreground">{hint}</span> : null}
        </span>
        <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground/70" />
      </Link>
    </li>
  )
}

export function StaffHome({ session }: { session: UserSession | null }) {
  const isSuper = session?.role === "superadmin"

  const rows: Row[] = [
    { href: "/add-student", label: "إضافة مخدوم", hint: "تسجيل مخدوم جديد وإصدار كود الدخول", icon: UserPlus },
    { href: "/students-list", label: "كشوفات المخدومين", hint: "البحث والتعديل والتصدير", icon: Users },
    { href: "/points-leaderboard", label: "النقاط ولوحة الشرف", hint: "إضافة أو خصم نقاط", icon: Award },
    { href: "/media", label: "الميديا والروابط", icon: PlaySquare },
  ]
  if (isSuper) rows.push({ href: "/manage-khodam", label: "إدارة الخدام", hint: "الحسابات وكلمات السر", icon: Shield })
  if (EFTEQAD_ENABLED) rows.push({ href: "/efteqad", label: "كشف الافتقاد", icon: HeartHandshake })

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">أهلاً بك</p>
        <p className="text-2xl font-semibold leading-tight">
          {session?.username}
          <span className="ms-2 align-middle text-sm font-normal text-muted-foreground">
            {isSuper ? "سوبر أدمن" : "خادم"}
          </span>
        </p>
      </div>

      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {rows.map((r) => (
          <NavRow key={r.href} {...r} />
        ))}
      </ul>

      <div className="space-y-3">
        <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">الحساب</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ChangeOwnPasswordDialog />
          <form action={handleLogout} className="contents">
            <button
              type="submit"
              className="tap inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-input px-5 text-base font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="h-5 w-5" />
              تسجيل الخروج
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
