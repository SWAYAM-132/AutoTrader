"use client"

import { Search, Bell, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/theme-provider"

export function DashboardHeader() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-4 md:px-6">
            <div className="flex items-center gap-4 w-full max-w-7xl mx-auto">
                {/* Logo Area */}
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight mr-8 text-foreground">
                    AutoTrader<span className="text-primary italic">X</span>
                </div>

                {/* Search Bar */}
                <div className="flex-1 max-w-2xl relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Ask anything about crypto, stocks, or markets..."
                        className="pl-10 bg-secondary/50 border-transparent focus:bg-secondary transition-all"
                    />
                </div>

                {/* Actions */}
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="hover:bg-secondary/50">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-secondary/50">
                        <User className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </div>
            </div>
        </header>
    )
}
