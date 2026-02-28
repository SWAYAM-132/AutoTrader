"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Bot,
    LayoutDashboard,
    LogOut,
    Newspaper,
    PieChart,
    Settings,
    TrendingUp,
} from "lucide-react"

type SidebarProps = React.HTMLAttributes<HTMLDivElement>

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()

    const routes = [
        { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        { label: "Portfolio", icon: PieChart, href: "/dashboard/portfolio" },
        { label: "Market", icon: TrendingUp, href: "/dashboard/market" },
        { label: "News", icon: Newspaper, href: "/dashboard/news" },
        { label: "AI Advisor", icon: Bot, href: "/dashboard/advisor" },
        { label: "Settings", icon: Settings, href: "/dashboard/settings" },
    ]

    const router = useRouter()

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
    }

    return (
        <div className={cn("pb-6 min-h-screen bg-transparent", className)}>
            <div className="space-y-4 py-6 px-3 flex flex-col h-full">
                <div className="px-2 pb-2 border-b border-white/5">
                    <p className="text-[10px] font-bold tracking-[0.25em] text-primary/80 uppercase">Workspace</p>
                </div>

                <div className="space-y-1 flex-1">
                    {routes.map((route) => {
                        const active = pathname === route.href
                        return (
                            <Button
                                key={route.href}
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start transition-all rounded-xl",
                                    active
                                        ? "bg-primary/15 text-primary hover:bg-primary/20"
                                        : "text-white/70 hover:text-white hover:bg-white/5",
                                )}
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className="mr-2 h-4 w-4" />
                                    {route.label}
                                </Link>
                            </Button>
                        )
                    })}
                </div>

                <div className="px-1 pt-3 border-t border-white/5 mt-auto">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all font-bold rounded-xl"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    )
}
