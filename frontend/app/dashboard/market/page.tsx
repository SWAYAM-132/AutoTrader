"use client"

import { PortfolioChart, StockChart } from "@/components/charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react"

const watchlist = [
    { ticker: "AAPL", name: "Apple Inc.", price: 189.84, change: 2.34, changePct: 1.25 },
    { ticker: "GOOGL", name: "Alphabet", price: 141.80, change: -1.12, changePct: -0.78 },
    { ticker: "MSFT", name: "Microsoft", price: 415.50, change: 5.67, changePct: 1.38 },
    { ticker: "TSLA", name: "Tesla Inc.", price: 248.42, change: -3.21, changePct: -1.28 },
    { ticker: "AMZN", name: "Amazon", price: 185.07, change: 1.89, changePct: 1.03 },
    { ticker: "BTC", name: "Bitcoin", price: 67234.00, change: 1245.00, changePct: 1.89 },
    { ticker: "ETH", name: "Ethereum", price: 3456.78, change: -45.23, changePct: -1.29 },
    { ticker: "NVDA", name: "NVIDIA", price: 878.36, change: 12.45, changePct: 1.44 },
]

export default function MarketPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Market</h2>
                <Badge variant="outline" className="gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Live
                </Badge>
            </div>

            {/* Stock Charts Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                <StockChart ticker="AAPL" name="Apple Inc." basePrice={189} />
                <StockChart ticker="BTC" name="Bitcoin" basePrice={67000} />
                <StockChart ticker="NVDA" name="NVIDIA Corp." basePrice={878} />
                <StockChart ticker="ETH" name="Ethereum" basePrice={3400} />
            </div>

            {/* Watchlist */}
            <Card>
                <CardHeader>
                    <CardTitle>Watchlist</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {watchlist.map((item) => (
                            <div
                                key={item.ticker}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${item.change >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                                        {item.change >= 0 ? (
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{item.ticker}</p>
                                        <p className="text-xs text-muted-foreground">{item.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">${item.price.toLocaleString()}</p>
                                    <div className={`flex items-center gap-1 text-xs ${item.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                                        {item.change >= 0 ? (
                                            <ArrowUpRight className="h-3 w-3" />
                                        ) : (
                                            <ArrowDownRight className="h-3 w-3" />
                                        )}
                                        <span>{item.change >= 0 ? "+" : ""}{item.changePct.toFixed(2)}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
