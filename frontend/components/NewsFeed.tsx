"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Clock, RefreshCcw, Filter, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

type NewsItem = {
    title: string
    link: string
    summary: string
    source: string
    source_type?: string
    published_at: string
    sentiment: "Positive" | "Neutral" | "Negative"
    relevance_score?: number
    prediction?: string
}

const predictionStyles: Record<string, string> = {
    Bullish: "bg-green-500/10 text-green-400 border-green-500/30",
    Bearish: "bg-red-500/10 text-red-400 border-red-500/30",
    Watch: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
}

export function NewsFeed() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchNews = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await api.get("/news/latest?min_relevance=0.3")
            setNews(response.data)
        } catch (err) {
            console.error("Failed to fetch news:", err)
            setError("Unable to load live feed.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNews()
    }, [])

    if (error) {
        return (
            <div className="p-8 text-center text-muted-foreground bg-card/20 rounded-xl border border-white/5">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{error}</p>
                <Button variant="link" onClick={fetchNews} className="mt-2 text-primary">Try Again</Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Global Intelligence Stream</h3>
                <Button variant="ghost" size="sm" onClick={fetchNews} disabled={loading} className="h-8 w-8 p-0">
                    <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
            </div>

            <div className="grid gap-4">
                {news.map((item, i) => (
                    <Card
                        key={i}
                        className="bg-card/40 border-white/5 hover:border-primary/30 transition-all duration-300 cursor-pointer group overflow-hidden"
                        onClick={() => window.open(item.link, "_blank")}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {item.prediction && (
                                            <Badge className={cn("rounded-md px-1.5 py-0.5 text-[10px] border", predictionStyles[item.prediction])}>
                                                {item.prediction}
                                            </Badge>
                                        )}
                                        <Badge variant="secondary" className="text-[10px] font-semibold bg-white/5 text-white/60">
                                            {item.source}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {item.published_at ? formatDistanceToNow(new Date(item.published_at)) : "Just now"}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold leading-snug group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {item.summary}
                                    </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {!loading && news.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        No news available right now.
                    </div>
                )}
            </div>
        </div>
    )
}
