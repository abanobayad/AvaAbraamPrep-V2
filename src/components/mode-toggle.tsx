"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="fixed bottom-4 left-4 z-50 rounded-full h-12 w-12 shadow-lg bg-background border-2 border-primary/20 hover:scale-105 transition-transform"
      title="تغيير المظهر"
    >
      <Sun className="h-[1.5rem] w-[1.5rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute h-[1.5rem] w-[1.5rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
      <span className="sr-only">تغيير المظهر</span>
    </Button>
  )
}
