"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])
    if (!mounted) return <div className="w-20 h-9" />

    return (
        <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
            <button
                onClick={() => setTheme("light")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${theme === "light"
                        ? "bg-white text-amber-500 shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                ☀️
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${theme === "dark"
                        ? "bg-slate-700 text-slate-100 shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                🌙
            </button>
        </div>
    )
}
