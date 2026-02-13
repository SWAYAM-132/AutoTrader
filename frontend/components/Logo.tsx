"use client"

import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-3 group", className)}>
            <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-[4px] animate-pulse group-hover:bg-primary/50 transition-colors" />
                <div className="relative bg-primary p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    <Zap className="h-5 w-5 text-white" />
                </div>
            </div>
            <span className="text-xl font-black tracking-tighter text-white">
                AutoTrader<span className="text-primary italic">X</span>
            </span>
        </div>
    )
}
