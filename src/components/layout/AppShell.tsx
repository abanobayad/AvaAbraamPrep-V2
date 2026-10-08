import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { UserSession } from "@/services/auth"
import { ModeToggle } from "@/components/mode-toggle"
import { NavBar } from "@/components/layout/NavBar"
import { cn } from "@/lib/utils"

type Props = {
  session: UserSession | null
  title: string
  /** Where the back arrow goes. Omit on top-level screens. */
  back?: string
  /** Extra controls on the leading (left) side of the top bar. */
  actions?: React.ReactNode
  /** Narrow single column for forms, wider for lists. */
  width?: "narrow" | "wide"
  children: React.ReactNode
}

/**
 * The one chrome every screen shares: a 56px top bar and, for staff, the
 * navigation bar (bottom on phones, inline on wider screens).
 */
export function AppShell({ session, title, back, actions, width = "wide", children }: Props) {
  const isStaff = session?.role === "superadmin" || session?.role === "admin"

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-2 md:px-4">
          <div className="flex w-11 shrink-0 items-center md:w-auto">
            {back ? (
              <Link
                href={back}
                aria-label="رجوع"
                className="tap flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ChevronRight className="h-6 w-6" />
              </Link>
            ) : null}
          </div>

          <h1 className="min-w-0 flex-1 truncate text-center text-base font-semibold md:text-start md:text-lg">
            {title}
          </h1>

          {isStaff && session ? <NavBar role={session.role} variant="top" /> : null}

          <div className="flex shrink-0 items-center justify-end gap-1">
            {actions}
            <ModeToggle />
          </div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto w-full px-4 pt-5",
          isStaff ? "pb-28 md:pb-12" : "pb-12",
          width === "narrow" ? "max-w-xl" : "max-w-3xl"
        )}
      >
        {children}
      </main>

      {isStaff && session ? <NavBar role={session.role} variant="bottom" /> : null}
    </div>
  )
}
