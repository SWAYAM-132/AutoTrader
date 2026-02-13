"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    PieChart,
    TrendingUp,
    Newspaper,
    Bot,
    Settings,
    LogOut
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()

    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard",
            active: pathname === "/dashboard",
        },
        {
            label: "Portfolio",
            icon: PieChart,
            href: "/dashboard/portfolio",
            active: pathname === "/dashboard/portfolio",
        },
        {
            label: "Market",
            icon: TrendingUp,
            href: "/dashboard/market",
            active: pathname === "/dashboard/market",
        },
        {
            label: "News",
            icon: Newspaper,
            href: "/dashboard/news",
            active: pathname === "/dashboard/news",
        },
        {
            label: "AI Advisor",
            icon: Bot,
            href: "/dashboard/advisor",
            active: pathname === "/dashboard/advisor",
        },
        {
            label: "Settings",
            icon: Settings,
            href: "/dashboard/settings",
            active: pathname === "/dashboard/settings",
        },
    ]

    const router = useRouter()

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
    }

    return (
        <div className={cn("pb-12 min-h-screen border-r border-white/5 bg-background", className)}>
            <div className="space-y-4 py-8 flex flex-col h-full">
                <div className="px-3 flex-1">
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? "secondary" : "ghost"}
                                className="w-full justify-start text-white/70 hover:text-white hover:bg-white/5 transition-all"
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className="mr-2 h-4 w-4" />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="px-3 py-2 mt-auto">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all font-bold"
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
