"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Bell, LogOut, Search, Sparkles, User, Zap } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

const getPageTitle = (pathname: string) => {
    const map: Record<string, string> = {
        "/dashboard": "Overview",
        "/dashboard/portfolio": "Portfolio",
        "/dashboard/market": "Market Monitor",
        "/dashboard/news": "News Signals",
        "/dashboard/advisor": "AI Advisor",
        "/dashboard/settings": "Settings",
    }

    return map[pathname] || "Dashboard"
}

export function Navbar() {
    const router = useRouter()
    const pathname = usePathname()

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/")
    }

    return (
        <div className="border-b border-white/10 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
            <div className="flex h-16 items-center gap-4 px-4 md:px-6">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">AutoTraderX</p>
                    <h1 className="text-sm md:text-base font-bold text-white truncate">{getPageTitle(pathname)}</h1>
                </div>

                <div className="hidden md:flex items-center flex-1 max-w-md relative group ml-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        type="search"
                        placeholder="Search tickers, sectors, events..."
                        className="w-full pl-10 bg-white/5 border-white/10 rounded-xl focus:ring-primary/40 focus:border-primary/50"
                    />
                </div>

                <div className="ml-auto flex items-center gap-2 md:gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10">
                        <Bell className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="hidden md:flex rounded-xl border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Run Scan
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-xl border border-white/10 hover:bg-white/5 transition-all p-0">
                                <Avatar className="h-8 w-8 rounded-lg overflow-hidden">
                                    <AvatarImage src="/avatars/01.png" alt="@user" />
                                    <AvatarFallback className="bg-primary/20 text-primary font-bold">U</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 border-white/10 mt-1" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-bold leading-none">Trader Pro</p>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                        pro.user@autotrader.x
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="cursor-pointer rounded-lg m-1">
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer rounded-lg m-1">
                                <Zap className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                                className="cursor-pointer text-red-400 rounded-lg m-1 font-bold"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}
