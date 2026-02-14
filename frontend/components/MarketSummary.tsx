"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, ExternalLink } from "lucide-react"

interface NewsItem {
    title: string
    summary: string
    source: string
    time: string
    url?: string
}

interface MarketSummaryProps {
    items: NewsItem[]
}

export function MarketSummary({ items }: MarketSummaryProps) {
    return (
        <Card className="bg-transparent border-none shadow-none">
            <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    Market Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
                {items.map((item, index) => (
                    <div key={index} className="group cursor-pointer">
                        <div className="bg-card/40 border border-white/5 rounded-lg p-4 hover:bg-card/60 transition-colors">
                            <div className="flex justify-between items-start gap-4">
                                <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                                    {item.title}
                                </h3>
                                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                                {item.summary}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-[10px] font-medium text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                                    {item.source}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {item.time}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                <div className="pt-2">
                    <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                        View all news <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </CardContent>
        </Card>
    )
}
