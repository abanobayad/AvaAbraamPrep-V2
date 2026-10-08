"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Award, PlaySquare, Shield } from "lucide-react"
import type { Role } from "@/services/auth"
import { cn } from "@/lib/utils"
import { staffHome } from "@/lib/routes"

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }

function itemsFor(role: Role): Item[] {
  const items: Item[] = [
    { href: staffHome(role), label: "الرئيسية", icon: Home },
    { href: "/students-list", label: "المخدومين", icon: Users },
    { href: "/points-leaderboard", label: "النقاط", icon: Award },
    { href: "/media", label: "الميديا", icon: PlaySquare },
  ]
  if (role === "superadmin") items.push({ href: "/manage-khodam", label: "الخدام", icon: Shield })
  return items
}

/**
 * Staff navigation. Renders as a bottom tab bar on phones and as a row of
 * links inside the top bar on wider screens.
 */
export function NavBar({ role, variant }: { role: Role; variant: "bottom" | "top" }) {
  const pathname = usePathname()
  const items = itemsFor(role)

  if (variant === "top") {
    return (
      <nav aria-label="التنقل" className="hidden items-center gap-1 md:flex">
        {items.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "tap rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav
      aria-label="التنقل"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-surface/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-3xl items-stretch">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "tap flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-6 w-6", active && "stroke-[2.25]")} />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
