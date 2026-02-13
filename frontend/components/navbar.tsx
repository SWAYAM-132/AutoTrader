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
import { Search, User, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export function Navbar() {
    const router = useRouter()

    const handleLogout = () => {
        // Clear local storage/session
        localStorage.removeItem("token") // Adjust based on actual storage key
        localStorage.removeItem("user")
        router.push("/login")
    }
    return (
        <div className="border-b border-white/10 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="flex h-16 items-center px-6 relative">
                {/* Left Side (Optional or Search) */}
                <div className="flex-1 hidden md:flex items-center">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            type="search"
                            placeholder="Intelligent search..."
                            className="w-[200px] pl-10 md:w-[260px] bg-white/5 border-white/10 rounded-xl focus:ring-primary/40 focus:border-primary/50 transition-all"
                        />
                    </div>
                </div>

                {/* Center - Brand & Logo */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-[4px] animate-pulse" />
                        <div className="relative bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
                            <Zap className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        AutoTraderX
                    </span>
                </div>

                {/* Right Side - Actions & Profile */}
                <div className="flex-1 flex items-center justify-end gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-xl border border-white/10 glass hover:bg-white/5 transition-all p-0">
                                <Avatar className="h-8 w-8 rounded-lg overflow-hidden">
                                    <AvatarImage src="/avatars/01.png" alt="@user" />
                                    <AvatarFallback className="bg-primary/20 text-primary font-bold">U</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 glass-card border-white/10 mt-1" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-bold leading-none">Trader Pro</p>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                        pro.user@autotrader.x
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 rounded-lg m-1">
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 rounded-lg m-1">
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                                className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 rounded-lg m-1 font-bold"
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

import { Zap } from "lucide-react"
