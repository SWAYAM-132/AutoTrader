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
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Generate realistic-looking portfolio data
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

function generateStockData(ticker: string, basePrice: number) {
    const data = []
    let price = basePrice
    const now = new Date()

    for (let i = 29; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        price += (Math.random() - 0.48) * (basePrice * 0.03)
        price = Math.max(price, basePrice * 0.7)
        data.push({
            date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            price: Math.round(price * 100) / 100,
            volume: Math.round(Math.random() * 10000000),
        })
    }
    return data
}

interface PortfolioChartProps {
    className?: string
}

export function PortfolioChart({ className }: PortfolioChartProps) {
    const [data, setData] = useState(generatePortfolioData())

    return (
        <Card className={cn("border-white/5 bg-black/40 shadow-2xl overflow-hidden", className)}>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-bold text-white tracking-tight">Portfolio Alpha</span>
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
                            formatter={(value?: number) => [`$${(value ?? 0).toLocaleString()}`, "Value"]}
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
    basePrice: number
    className?: string
}

export function StockChart({ ticker, name, basePrice, className }: StockChartProps) {
    const [data] = useState(() => generateStockData(ticker, basePrice))
    const currentPrice = data[data.length - 1]?.price ?? basePrice
    const prevPrice = data[data.length - 2]?.price ?? basePrice
    const change = currentPrice - prevPrice
    const changePct = ((change / prevPrice) * 100).toFixed(2)
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
                        <div className="text-xl font-bold tracking-tight text-white">${currentPrice.toLocaleString()}</div>
                        <div className={`text-xs font-black flex items-center justify-end gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {isPositive ? "+" : ""}{change.toFixed(2)} ({isPositive ? "+" : ""}{changePct}%)
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
                            formatter={(value?: number) => [`$${(value ?? 0).toFixed(2)}`, "Price"]}
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

