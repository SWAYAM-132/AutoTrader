"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface TickerCardProps {
    symbol: string
    name: string
    price: string
    change: string
    changePercent: string
    isPositive: boolean
    data: { value: number }[]
}

export function TickerCard({ symbol, name, price, change, changePercent, isPositive, data }: TickerCardProps) {
    return (
        <Card className="bg-card/50 border-border/50 hover:bg-card hover:border-border transition-all duration-300 group overflow-hidden">
            <CardContent className="p-4 relative">
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-lg font-bold text-foreground">{symbol}</h3>
                            <span className={`text-xs font-medium ${isPositive ? "text-green-500" : "text-red-500"} flex items-center gap-0.5`}>
                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {changePercent}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">{name}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold text-foreground">{price}</div>
                        <div className={`text-xs font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                            {change}
                        </div>
                    </div>
                </div>

                {/* Mini Sparkline */}
                <div className="h-[60px] w-[120%] -mx-[10%] -mb-6 opacity-30 group-hover:opacity-50 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                                fill={`url(#gradient-${symbol})`}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
