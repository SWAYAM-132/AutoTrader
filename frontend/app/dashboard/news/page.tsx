"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Clock, Loader2, Filter, RefreshCcw, Search } from "lucide-react"
import api from "@/lib/api"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type NewsItem = {
    title: string
    link: string
    summary: string
    source: string
    source_type?: "market" | "social" | "blog"
    published_at: string
    sentiment: "Positive" | "Neutral" | "Negative"
    relevance_score?: number
    signal_score?: number
    prediction?: "Bullish" | "Bearish" | "Watch"
}

const predictionStyles: Record<string, string> = {
    Bullish: "bg-green-500/10 text-green-400 border-green-500/30",
    Bearish: "bg-red-500/10 text-red-400 border-red-500/30",
    Watch: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
}

const sourceTypeLabels: Record<string, string> = {
    market: "Market Feeds",
    social: "Reddit / X",
    blog: "Blog Articles",
}

const sourceTypes: Array<"market" | "social" | "blog"> = ["market", "social", "blog"]

export default function NewsPage() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)
    const [minRelevanceInput, setMinRelevanceInput] = useState("0.50")
    const [onlyActionable, setOnlyActionable] = useState(true)
    const [selectedSources, setSelectedSources] = useState<Array<"market" | "social" | "blog">>(["market", "social", "blog"])
    const [query, setQuery] = useState("")

    const minRelevance = useMemo(() => {
        const parsed = Number.parseFloat(minRelevanceInput)
        if (Number.isNaN(parsed)) return 0.5
        return Math.max(0, Math.min(parsed, 1))
    }, [minRelevanceInput])

    const fetchNews = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                limit: "25",
                min_relevance: minRelevance.toFixed(2),
                only_actionable: String(onlyActionable),
            })

            selectedSources.forEach((sourceType) => {
                params.append("source_types", sourceType)
            })

            const response = await api.get(`/news/latest?${params.toString()}`)
            setNews(response.data)
        } catch (error) {
            console.error("Error fetching news:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNews()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minRelevance, onlyActionable, selectedSources])

    const filteredNews = useMemo(() => {
        const searchValue = query.trim().toLowerCase()
        if (!searchValue) return news

        return news.filter((item) => {
            const haystack = `${item.title} ${item.summary} ${item.source}`.toLowerCase()
            return haystack.includes(searchValue)
        })
    }, [news, query])

    const toggleSource = (sourceType: "market" | "social" | "blog") => {
        setSelectedSources((current) => {
            if (current.includes(sourceType)) {
                if (current.length === 1) return current
                return current.filter((value) => value !== sourceType)
            }
            return [...current, sourceType]
        })
    }

    return (
        <div className="space-y-6 p-6 md:p-10 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between gap-4 md:items-end">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-white">Interactive Multi-Source News Scanner</h2>
                    <p className="text-muted-foreground">Signals from market feeds, Reddit/X social streams, and investing blogs.</p>
                </div>
                <Badge variant="outline" className="gap-2 px-3 py-1.5 border-primary/20 bg-primary/5 text-primary rounded-xl">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    Live model filtering
                </Badge>
            </div>

            <Card className="border-white/10 bg-black/30">
                <CardContent className="p-4 md:p-5 space-y-4">
                    <div className="flex flex-col md:flex-row gap-3 md:items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-fit">
                            <Filter className="h-4 w-4" />
                            Min relevance
                        </div>
                        <Input
                            value={minRelevanceInput}
                            onChange={(e) => setMinRelevanceInput(e.target.value)}
                            placeholder="0.50"
                            className="md:w-28 bg-white/5 border-white/10"
                        />
                        <Button variant={onlyActionable ? "default" : "outline"} onClick={() => setOnlyActionable((prev) => !prev)}>
                            {onlyActionable ? "Only actionable" : "Include watchlist"}
                        </Button>
                        <Button variant="outline" className="md:ml-auto" onClick={fetchNews}>
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {sourceTypes.map((sourceType) => {
                            const active = selectedSources.includes(sourceType)
                            return (
                                <Button
                                    key={sourceType}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleSource(sourceType)}
                                    className={cn(
                                        "rounded-full border-white/10",
                                        active ? "bg-primary/15 text-primary border-primary/40" : "bg-transparent text-white/70",
                                    )}
                                >
                                    {sourceTypeLabels[sourceType]}
                                </Button>
                            )
                        })}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search story text, source, or ticker"
                            className="pl-10 bg-white/5 border-white/10"
                        />
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-60">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm font-bold tracking-widest uppercase">Scanning live feeds...</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredNews.map((item, i) => (
                        <Card
                            key={i}
                            className="bg-card/40 border-white/5 hover:border-primary/30 transition-all duration-300 cursor-pointer group rounded-2xl overflow-hidden"
                            onClick={() => window.open(item.link, "_blank")}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge className={cn("rounded-md px-2 py-1 text-[10px] border", predictionStyles[item.prediction || "Watch"])}>
                                                {item.prediction || "Watch"}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[10px] font-semibold">
                                                {sourceTypeLabels[item.source_type || "market"] || "Other source"}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[10px] font-semibold">
                                                Relevance {(item.relevance_score ?? 0).toFixed(2)}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[10px] font-semibold">
                                                Signal {(item.signal_score ?? 0).toFixed(2)}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                                <Clock className="h-3.5 w-3.5" />
                                                {item.published_at ? `${formatDistanceToNow(new Date(item.published_at))} ago` : "Recently"}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold leading-snug text-white group-hover:text-primary transition-colors">{item.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed text-sm line-clamp-2">{item.summary}</p>
                                        <p className="text-[11px] uppercase tracking-wider text-white/50">{item.source}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 group-hover:border-primary/50 group-hover:bg-primary/20 transition-all">
                                        <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {!filteredNews.length && (
                        <Card className="border-white/10 bg-black/30">
                            <CardContent className="py-10 text-center text-sm text-muted-foreground">
                                No articles matched your filters. Try lowering relevance or enabling additional source types.
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}
