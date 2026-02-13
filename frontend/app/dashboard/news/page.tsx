"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Clock, Loader2, Newspaper } from "lucide-react"
import api from "@/lib/api"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

const categoryColors: Record<string, string> = {
    Macro: "bg-blue-500/10 text-blue-500",
    Crypto: "bg-orange-500/10 text-orange-500",
    Tech: "bg-purple-500/10 text-purple-500",
    Commodities: "bg-yellow-500/10 text-yellow-500",
    Auto: "bg-green-500/10 text-green-500",
    Finance: "bg-emerald-500/10 text-emerald-500",
}

export default function NewsPage() {
    const [news, setNews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await api.get("/news/latest?limit=20")
                setNews(response.data)
            } catch (error) {
                console.error("Error fetching news:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchNews()
    }, [])

    return (
        <div className="space-y-8 p-6 md:p-10 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black tracking-tighter text-white">Market <span className="text-primary italic">Intelligence</span></h2>
                    <p className="text-muted-foreground font-medium">Global financial feeds synchronized in real-time.</p>
                </div>
                <Badge variant="outline" className="gap-2 px-4 py-1.5 border-primary/20 bg-primary/5 text-primary rounded-xl">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    LIVE FEED ACTIVE
                </Badge>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm font-bold tracking-widest uppercase">FETCHING DATA STREAM...</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {news.map((item, i) => (
                        <Card
                            key={i}
                            className="bg-card/40 border-white/5 hover:border-primary/30 transition-all duration-300 cursor-pointer group rounded-3xl overflow-hidden"
                            onClick={() => window.open(item.link, '_blank')}
                        >
                            <CardContent className="p-8">
                                <div className="flex items-start justify-between gap-6">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-3">
                                            <Badge className={cn("rounded-lg px-3 py-1 font-bold text-[10px] tracking-wider transition-colors", categoryColors[item.category] || "bg-white/5 text-white/40")} variant="secondary">
                                                {item.category || "GENERAL"}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                                <Clock className="h-3.5 w-3.5" />
                                                {item.published_at ? formatDistanceToNow(new Date(item.published_at)) + " ago" : "Recently"}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold leading-snug text-white group-hover:text-primary transition-colors">{item.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed font-medium line-clamp-2">{item.summary}</p>
                                        <div className="flex items-center gap-4 pt-2">
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                <span className="text-[10px] font-black tracking-widest uppercase text-white/50">{item.source}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:border-primary/50 group-hover:bg-primary/20 transition-all">
                                        <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
