"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Plus, Star } from "lucide-react"

interface WatchlistItem {
    symbol: string
    name: string
    price: string
    change: string
    isPositive: boolean
}

interface WatchlistSidebarProps {
    items: WatchlistItem[]
}

export function WatchlistSidebar({ items }: WatchlistSidebarProps) {
    return (
        <Card className="bg-transparent border-none shadow-none h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-0 pt-0">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    Your Watchlist
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
            </CardHeader>
            <CardContent className="px-0 space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-md group-hover:bg-primary/10 transition-colors">
                                <Star className="h-4 w-4 text-muted-foreground group-hover:text-primary fill-current opacity-20 group-hover:opacity-100 transition-all" />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-foreground">{item.symbol}</div>
                                <div className="text-xs text-muted-foreground">{item.name}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-medium text-sm text-foreground">{item.price}</div>
                            <div className={`text-xs ${item.isPositive ? "text-green-500" : "text-red-500"}`}>
                                {item.change}
                            </div>
                        </div>
                    </div>
                ))}

                <Button variant="outline" className="w-full mt-4 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all">
                    <Plus className="h-4 w-4 mr-2" /> Add Asset
                </Button>
            </CardContent>
        </Card>
    )
}
