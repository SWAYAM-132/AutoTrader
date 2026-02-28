"use client"

import { DashboardHeader } from "@/components/DashboardHeader"
import { TickerCard } from "@/components/TickerCard"

import { WatchlistSidebar } from "@/components/WatchlistSidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Globe, Wallet, Zap, Loader2, TrendingUp } from "lucide-react"
import { NewsFeed } from "@/components/NewsFeed"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import api from "@/lib/api"

const PredictionMarketWidget = dynamic(() => import("@/components/PredictionMarketWidget").then(mod => mod.PredictionMarketWidget), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full bg-card/40 animate-pulse rounded-xl border border-white/5" />,
})

const MarketSummary = dynamic(() => import("@/components/MarketSummary").then(mod => mod.MarketSummary), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full bg-card/40 animate-pulse rounded-xl" />,
})

const PortfolioView = dynamic(() => import("@/components/PortfolioView").then(mod => mod.PortfolioView), {
    ssr: false,
    loading: () => <div className="h-[400px] bg-card/40 animate-pulse rounded-xl" />,
})

const ChatInterface = dynamic(() => import("@/components/chat-interface").then(mod => mod.ChatInterface), {
    ssr: false,
    loading: () => <div className="h-[600px] bg-card/40 animate-pulse rounded-xl border border-white/5" />,
})

// Symbols to fetch for the Top Movers section
const TOP_MOVER_SYMBOLS = ["BTC-USD", "ETH-USD", "NVDA", "SPY", "GC=F"]

interface TickerData {
    symbol: string
    name: string
    price: string
    change: string
    changePercent: string
    isPositive: boolean
    changeVal: number
    priceVal: number
    sentimentScore?: number
}

interface PredictionItem {
    question: string
    probability: number
    volume: string
    trend: number
}

interface NewsItem {
    title: string
    summary: string
    source: string
    time: string
    url?: string
}

const SYMBOL_NAMES: Record<string, string> = {
    "BTC-USD": "Bitcoin",
    "ETH-USD": "Ethereum",
    "NVDA": "NVIDIA Corp",
    "AAPL": "Apple Inc",
    "TSLA": "Tesla Inc",
    "MSFT": "Microsoft Corp",
    "GOOGL": "Alphabet Inc",
    "AMZN": "Amazon.com",
    "META": "Meta Platforms",
    "SPY": "S&P 500",
    "GC=F": "Gold",
}

export default function DashboardPage() {
    const [tickerData, setTickerData] = useState<TickerData[]>([])
    const [predictions, setPredictions] = useState<PredictionItem[]>([])
    const [globalEvents, setGlobalEvents] = useState<PredictionItem[]>([])
    const [newsItems, setNewsItems] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    async function fetchDashboardData() {
        setLoading(true)
        try {
            // Fetch sentiment + news IN PARALLEL for faster loading
            const [sentimentResults, newsRes] = await Promise.all([
                Promise.allSettled(
                    TOP_MOVER_SYMBOLS.map((sym) => api.get(`/market/sentiment/${sym}`))
                ),
                api.get("/news/latest").catch(() => ({ data: [] })),
            ])

            // Process sentiment results
            const tickers: TickerData[] = []
            const sentimentMap: Record<string, any> = {}

            for (const result of sentimentResults) {
                if (result.status === "fulfilled") {
                    const d = result.value.data
                    const isPositive = d.change_percent >= 0
                    const dollarChange = Math.abs(d.price * d.change_percent / 100)
                    tickers.push({
                        symbol: d.symbol,
                        name: SYMBOL_NAMES[d.symbol] || d.symbol,
                        price: `$${d.price.toLocaleString()}`,
                        change: `${isPositive ? "+" : "-"}$${dollarChange.toFixed(2)}`,
                        changePercent: `${Math.abs(d.change_percent).toFixed(2)}%`,
                        isPositive,
                        changeVal: d.change_percent,
                        priceVal: d.price,
                        sentimentScore: d.score,
                    })
                    sentimentMap[d.symbol] = d
                }
            }
            setTickerData(tickers)

            // Derive Predictions
            const btcData = sentimentMap["BTC-USD"]
            const btcProb = btcData ? Math.min(Math.max(btcData.score * 100, 10), 95) : 50
            const btcTrend = btcData ? btcData.change_percent : 0

            const spyData = sentimentMap["SPY"]
            const spyProb = spyData ? Math.min(Math.max(spyData.score * 100, 15), 90) : 60
            const spyTrend = spyData ? spyData.change_percent : 0

            setPredictions([
                {
                    question: "Bitcoin to hit $100k by Q4?",
                    probability: Math.round(btcProb),
                    volume: "$42M",
                    trend: btcTrend
                },
                {
                    question: "S&P 500 Bull Run Continues?",
                    probability: Math.round(spyProb),
                    volume: "$125M",
                    trend: spyTrend
                },
            ])

            const goldData = sentimentMap["GC=F"]
            const goldProb = goldData ? Math.min(Math.max(goldData.score * 100, 20), 85) : 45
            setGlobalEvents([
                {
                    question: "Gold Breaks ATH this month?",
                    probability: Math.round(goldProb),
                    volume: "$88M",
                    trend: goldData ? goldData.change_percent : 0.5
                }
            ])

            // Process news results
            if (newsRes.data && newsRes.data.length > 0) {
                const items = newsRes.data.slice(0, 5).map((n: any) => ({
                    title: n.title,
                    summary: n.summary,
                    source: n.source,
                    time: new Date(n.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    url: n.url
                }))
                setNewsItems(items)
            }

        } catch (err) {
            console.error("Failed to fetch dashboard data:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <DashboardHeader />

            <main className="pt-24 px-4 md:px-6 max-w-[1600px] mx-auto">
                <div className="mb-12">
                    <ChatInterface />
                </div>

                <Tabs defaultValue="market" className="space-y-8">
                    <TabsList className="bg-transparent border-b border-white/10 w-full justify-start h-auto p-0 gap-6 rounded-none">
                        <TabsTrigger value="market" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-muted-foreground data-[state=active]:text-foreground font-medium text-sm flex items-center gap-2">
                            <Globe className="h-4 w-4" /> Market Overview
                        </TabsTrigger>
                        <TabsTrigger value="crypto" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-muted-foreground data-[state=active]:text-foreground font-medium text-sm flex items-center gap-2">
                            <Zap className="h-4 w-4" /> Crypto & De-Fi
                        </TabsTrigger>
                        <TabsTrigger value="portfolio" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-muted-foreground data-[state=active]:text-foreground font-medium text-sm flex items-center gap-2">
                            <Wallet className="h-4 w-4" /> Portfolio
                        </TabsTrigger>
                        <TabsTrigger value="news" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-muted-foreground data-[state=active]:text-foreground font-medium text-sm flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Live News
                        </TabsTrigger>
                    </TabsList>

                    {/* MARKET TAB */}
                    <TabsContent value="market" className="space-y-8 animate-in fade-in duration-500">
                        {/* Top Movers Row */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <h3 className="text-xl font-bold">Top Movers</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="h-[120px] bg-card/40 animate-pulse rounded-xl border border-white/5" />
                                    ))
                                ) : tickerData.length > 0 ? (
                                    tickerData.map(t => (
                                        <TickerCard key={t.symbol} {...t} data={[
                                            { value: 100 },
                                            { value: t.isPositive ? 105 : 95 },
                                            { value: t.isPositive ? 110 : 90 }
                                        ]} />
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground col-span-5 text-center py-4">No ticker data available</p>
                                )}
                            </div>
                        </div>

                        {/* Predictions + News Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <PredictionMarketWidget
                                        title="Market Predictions"
                                        items={predictions.length > 0 ? predictions : [
                                            { question: "Loading markets...", probability: 50, volume: "-", trend: 0 }
                                        ]}
                                    />
                                    <PredictionMarketWidget
                                        title="Global Events"
                                        items={globalEvents.length > 0 ? globalEvents : [
                                            { question: "Loading events...", probability: 50, volume: "-", trend: 0 }
                                        ]}
                                    />
                                </div>
                            </div>

                            {/* Sidebar: News */}
                            <div className="space-y-6">
                                <MarketSummary items={newsItems.length > 0 ? newsItems : [
                                    { title: "Loading news...", summary: "Fetching latest market updates...", source: "System", time: "Now" }
                                ]} />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="crypto" className="animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {loading ? (
                                <div className="col-span-4 flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                tickerData
                                    .filter(t => ["BTC-USD", "ETH-USD"].includes(t.symbol))
                                    .map(t => <TickerCard key={t.symbol + "c"} {...t} data={[
                                        { value: 100 },
                                        { value: t.isPositive ? 105 : 95 },
                                        { value: t.isPositive ? 110 : 90 }
                                    ]} />)
                            )}
                        </div>
                        <div className="p-12 border border-dashed border-white/10 rounded-xl text-center text-muted-foreground">
                            Advanced Crypto Charts & On-Chain Analysis (Coming Soon)
                        </div>
                    </TabsContent>

                    <TabsContent value="portfolio" className="animate-in fade-in duration-500">
                        <PortfolioView />
                    </TabsContent>

                    <TabsContent value="news" className="animate-in fade-in duration-500">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <NewsFeed />
                        </div>
                    </TabsContent>

                </Tabs>
            </main>
        </div>
    )
}
