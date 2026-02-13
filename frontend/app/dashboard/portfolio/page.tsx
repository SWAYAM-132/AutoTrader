"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, TrendingUp, PieChart } from "lucide-react"
import {
    ResponsiveContainer,
    PieChart as RechartsPie,
    Pie,
    Cell,
    Tooltip,
} from "recharts"

const holdings = [
    { ticker: "AAPL", name: "Apple Inc.", shares: 15, avgCost: 175.00, currentPrice: 189.84, allocation: 25 },
    { ticker: "NVDA", name: "NVIDIA Corp.", shares: 5, avgCost: 800.00, currentPrice: 878.36, allocation: 20 },
    { ticker: "BTC", name: "Bitcoin", shares: 0.5, avgCost: 60000.00, currentPrice: 67234.00, allocation: 30 },
    { ticker: "MSFT", name: "Microsoft", shares: 8, avgCost: 380.00, currentPrice: 415.50, allocation: 15 },
    { ticker: "ETH", name: "Ethereum", shares: 5, avgCost: 3200.00, currentPrice: 3456.78, allocation: 10 },
]

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#06b6d4"]

const allocationData = holdings.map((h, i) => ({
    name: h.ticker,
    value: h.allocation,
}))

export default function PortfolioPage() {
    const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0)
    const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.avgCost, 0)
    const totalPnL = totalValue - totalCost
    const totalPnLPct = ((totalPnL / totalCost) * 100).toFixed(2)

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Portfolio</h2>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({totalPnLPct}%)
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{holdings.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Allocation + Holdings */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Allocation Pie Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-4 w-4" /> Allocation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <RechartsPie>
                                <Pie
                                    data={allocationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {allocationData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        color: 'hsl(var(--foreground))',
                                    }}
                                    formatter={(value?: number) => [`${value}%`, "Allocation"]}
                                />
                            </RechartsPie>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-3 justify-center mt-2">
                            {allocationData.map((item, i) => (
                                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                    {item.name} ({item.value}%)
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Holdings Table */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Holdings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {holdings.map((h) => {
                                const pnl = (h.currentPrice - h.avgCost) * h.shares
                                const pnlPct = ((h.currentPrice - h.avgCost) / h.avgCost * 100).toFixed(2)
                                const isPositive = pnl >= 0
                                return (
                                    <div key={h.ticker} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div>
                                            <p className="font-semibold">{h.ticker}</p>
                                            <p className="text-xs text-muted-foreground">{h.shares} shares @ ${h.avgCost.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">${(h.shares * h.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                            <div className={`flex items-center gap-1 text-xs justify-end ${isPositive ? "text-green-500" : "text-red-500"}`}>
                                                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                {isPositive ? "+" : ""}${pnl.toFixed(2)} ({pnlPct}%)
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
