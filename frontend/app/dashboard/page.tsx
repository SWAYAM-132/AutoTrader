"use client"

import { DashboardHeader } from "@/components/DashboardHeader"
import { TickerCard } from "@/components/TickerCard"

import { WatchlistSidebar } from "@/components/WatchlistSidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Globe, Wallet, Zap, Loader2 } from "lucide-react"
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

const MarketHeatmap = dynamic(() => import('@/components/MarketHeatmap').then(mod => mod.MarketHeatmap), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-card/40 animate-pulse rounded-xl border border-white/5" />,
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
const TOP_MOVER_SYMBOLS = ["BTC-USD", "ETH-USD", "NVDA", "SPY", "GC=F"] // Added SPY/Gold for predictions

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
            // 1. Fetch Sentiment/Price Data
            const results = await Promise.allSettled(
                TOP_MOVER_SYMBOLS.map((sym) => api.get(`/market/sentiment/${sym}`))
            )

            const tickers: TickerData[] = []
            const sentimentMap: Record<string, any> = {}

            for (const result of results) {
                if (result.status === "fulfilled") {
                    const d = result.value.data
                    const isPositive = d.change_percent >= 0
                    tickers.push({
                        symbol: d.symbol,
                        name: SYMBOL_NAMES[d.symbol] || d.symbol,
                        price: `$${d.price.toLocaleString()}`,
                        change: `${isPositive ? "+" : ""}$${Math.abs(d.change * d.change_percent / 100).toFixed(2)}`, // Approx change val
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

            // 2. Derive Predictions from Data
            // BTC Prediction
            const btcData = sentimentMap["BTC-USD"]
            const btcProb = btcData ? Math.min(Math.max(btcData.score * 100, 10), 95) : 50
            const btcTrend = btcData ? btcData.change_percent : 0

            // SPY Prediction
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

            // Global Event (Gold/Oil)
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

            // 3. Fetch News
            const newsRes = await api.get("/news/latest")
            if (newsRes.data) {
                const items = newsRes.data.slice(0, 3).map((n: any) => ({
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
                        {/* Tabs Triggers... reused existing classes */}
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
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <h3 className="text-xl font-bold">S&P 500 Performance</h3>
                                <MarketHeatmap />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
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

                            {/* Sidebar: Tickers & News */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold">Top Movers</h3>
                                <div className="space-y-4">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : tickerData.length > 0 ? (
                                        tickerData
                                            .filter(t => ["BTC-USD", "ETH-USD", "NVDA"].includes(t.symbol))
                                            .map(t => <TickerCard key={t.symbol} {...t} data={[
                                                { value: 100 },
                                                { value: t.isPositive ? 105 : 95 },
                                                { value: t.isPositive ? 110 : 90 }
                                            ]} />)
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">No ticker data available</p>
                                    )}
                                </div>
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
