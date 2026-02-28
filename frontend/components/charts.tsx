"use client"

import { useEffect, useState } from "react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import api from "@/lib/api"

// Keep PortfolioChart as is for now (or remove if unused)
function generatePortfolioData() {
    const data = []
    let value = 42000
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    for (let i = 0; i < 12; i++) {
        value += (Math.random() - 0.35) * 2000
        data.push({
            month: months[i],
            value: Math.round(value * 100) / 100,
        })
    }
    return data
}

export function PortfolioChart({ className }: { className?: string }) {
    const [data] = useState(generatePortfolioData())

    return (
        <Card className={cn("border-white/5 bg-black/40 shadow-2xl overflow-hidden", className)}>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-bold text-white tracking-tight">Portfolio Performance</span>
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400/20 bg-green-400/5">
                        +20.1% YTD
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="oklch(0.7 0.2 250)" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="oklch(0.7 0.2 250)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#000',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                            }}
                            itemStyle={{ color: 'oklch(0.7 0.2 250)', fontWeight: 'bold' }}
                            labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}
                            formatter={(value: any) => [`$${(value ?? 0).toLocaleString()}`, "Value"]}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="oklch(0.7 0.2 250)"
                            fill="url(#portfolioGradient)"
                            strokeWidth={3}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

interface StockChartProps {
    ticker: string
    name: string
    basePrice?: number // Optional now
    className?: string
}

export function StockChart({ ticker, name, className }: StockChartProps) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        let mounted = true
        async function fetchData() {
            try {
                // Determine interval based on ticker type if needed, but endpoint handles it.
                // For crypto (BTC), 1mo/1d is fine. For stocks, same.
                const res = await api.get(`/market/history/${ticker}?period=1mo&interval=1d`)
                if (mounted && res.data && res.data.history) {
                    const history = res.data.history.map((h: any) => ({
                        date: new Date(h.timestamp * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                        price: h.close || h.open, // Fallback if close is null
                    })).filter((h: any) => h.price !== null)
                    setData(history)
                }
            } catch (err) {
                console.error(`Failed to fetch history for ${ticker}`, err)
                if (mounted) setError(true)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        fetchData()
        return () => { mounted = false }
    }, [ticker])

    if (loading) {
        return (
            <Card className={cn("border-white/5 bg-black/20 h-[280px] flex items-center justify-center", className)}>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </Card>
        )
    }

    if (error || data.length === 0) {
        return (
            <Card className={cn("border-white/5 bg-black/20 h-[280px] flex items-center justify-center", className)}>
                <div className="text-center text-muted-foreground text-sm">
                    <p>Failed to load data</p>
                    <p className="text-xs">{ticker}</p>
                </div>
            </Card>
        )
    }

    const currentPrice = data[data.length - 1]?.price || 0
    const prevPrice = data[0]?.price || 0 // Compare with start of month for "monthly change"
    // Or compare with yesterday? simpler is start of period for the chart
    // But typically user wants 24h change. 
    // The chart shows 1mo. The "change" displayed should probably be the 1mo change if the chart is 1mo.
    // Let's use the first point of the chart as reference for the chart's "change" display.
    const change = currentPrice - prevPrice
    const changePct = prevPrice > 0 ? ((change / prevPrice) * 100).toFixed(2) : "0.00"
    const isPositive = change >= 0

    return (
        <Card className={cn("border-white/5 bg-black/20 hover:border-white/10 transition-all group", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                    <div>
                        <span className="text-xl font-black tracking-tighter text-white group-hover:text-primary transition-colors">{ticker}</span>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none mt-1">{name}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold tracking-tight text-white">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className={`text-xs font-black flex items-center justify-end gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {isPositive ? "+" : ""}{change.toFixed(2)} ({isPositive ? "+" : ""}{changePct}%)
                            <span className="text-[10px] text-muted-foreground font-normal ml-1">1mo</span>
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                        <XAxis
                            dataKey="date"
                            hide
                        />
                        <YAxis
                            hide
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#000',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                            }}
                            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Price"]}
                        />
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke={isPositive ? "oklch(0.8 0.2 140)" : "oklch(0.7 0.2 30)"}
                            strokeWidth={3}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
