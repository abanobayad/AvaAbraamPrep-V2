import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

/** A bordered, divided list. The main building block of every screen. */
export function List({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("divide-y overflow-hidden rounded-xl border bg-card", className)} {...props} />
}

const rowBase = "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-start"
const rowInteractive =
  "tap transition-colors duration-150 hover:bg-accent/60 active:bg-accent focus-visible:bg-accent focus-visible:outline-none"

export function ListItem({ className, children }: { className?: string; children: React.ReactNode }) {
  return <li className={cn(rowBase, className)}>{children}</li>
}

export function ListButton({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <li>
      <button type="button" className={cn(rowBase, rowInteractive, className)} {...props}>
        {children}
      </button>
    </li>
  )
}

export function ListLink({
  href,
  external,
  className,
  children,
}: {
  href: string
  external?: boolean
  className?: string
  children: React.ReactNode
}) {
  const cls = cn(rowBase, rowInteractive, className)
  return (
    <li>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
          {children}
        </a>
      ) : (
        <Link href={href} className={cls}>
          {children}
        </Link>
      )}
    </li>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <List aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex min-h-14 items-center gap-3 px-4 py-3">
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="ms-auto h-4 w-10 animate-pulse rounded bg-muted" />
        </li>
      ))}
    </List>
  )
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}
