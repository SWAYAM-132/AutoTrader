"use client"

import { useEffect, useState } from "react"
import { StockChart } from "@/components/charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import api from "@/lib/api"

const WATCHLIST_TICKERS = [
    { ticker: "AAPL", name: "Apple Inc." },
    { ticker: "GOOGL", name: "Alphabet" },
    { ticker: "MSFT", name: "Microsoft" },
    { ticker: "TSLA", name: "Tesla Inc." },
    { ticker: "AMZN", name: "Amazon" },
    { ticker: "BTC", name: "Bitcoin" }, // Normalization handles -USD
    { ticker: "ETH", name: "Ethereum" },
    { ticker: "NVDA", name: "NVIDIA" },
]

type WatchlistItem = {
    ticker: string
    name: string
    price: number
    change: number // derived from price * changePct/100
    changePct: number
}

export default function MarketPage() {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchWatchlist() {
            try {
                const results = await Promise.all(
                    WATCHLIST_TICKERS.map(async (item) => {
                        try {
                            // normalize crypto for API calls if needed, but endpoint does it
                            const sym = ["BTC", "ETH"].includes(item.ticker) ? `${item.ticker}-USD` : item.ticker
                            const res = await api.get(`/market/sentiment/${sym}`)
                            const data = res.data
                            return {
                                ticker: item.ticker,
                                name: item.name,
                                price: data.price,
                                changePct: data.change_percent,
                                change: (data.price * data.change_percent) / 100
                            }
                        } catch (e) {
                            console.error(`Failed to fetch ${item.ticker}`, e)
                            return null
                        }
                    })
                )
                setWatchlist(results.filter((i): i is WatchlistItem => i !== null))
            } catch (err) {
                console.error("Failed to fetch watchlist", err)
            } finally {
                setLoading(false)
            }
        }
        fetchWatchlist()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Market</h2>
                <Badge variant="outline" className="gap-1 border-green-500/20 bg-green-500/10 text-green-400">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
                    Live Data
                </Badge>
            </div>

            {/* Stock Charts Grid - uses the updated StockChart component which fetches its own history */}
            <div className="grid gap-4 md:grid-cols-2">
                <StockChart ticker="AAPL" name="Apple Inc." />
                <StockChart ticker="BTC-USD" name="Bitcoin" />
                <StockChart ticker="NVDA" name="NVIDIA Corp." />
                <StockChart ticker="ETH-USD" name="Ethereum" />
            </div>

            {/* Watchlist */}
            <Card className="border-white/5 bg-black/20">
                <CardHeader>
                    <CardTitle>Watchlist</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {watchlist.map((item) => {
                                const isPositive = item.changePct >= 0
                                return (
                                    <div
                                        key={item.ticker}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isPositive ? "bg-green-500/10" : "bg-red-500/10"}`}>
                                                {isPositive ? (
                                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{item.ticker}</p>
                                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{item.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-white text-lg">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            <div className={`flex items-center gap-1 text-xs font-bold justify-end ${isPositive ? "text-green-400" : "text-red-400"}`}>
                                                {isPositive ? (
                                                    <ArrowUpRight className="h-3 w-3" />
                                                ) : (
                                                    <ArrowDownRight className="h-3 w-3" />
                                                )}
                                                <span>{isPositive ? "+" : ""}{item.change.toFixed(2)} ({isPositive ? "+" : ""}{item.changePct.toFixed(2)}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
