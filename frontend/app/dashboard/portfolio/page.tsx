"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, TrendingUp, PieChart, Loader2 } from "lucide-react"
import {
    ResponsiveContainer,
    PieChart as RechartsPie,
    Pie,
    Cell,
    Tooltip,
} from "recharts"
import api from "@/lib/api"

type PortfolioItem = {
    id: number
    symbol: string
    quantity: number
    avg_cost: number
    current_price: number
    value: number
    pnl: number
    pnl_percent: number
}

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#06b6d4"]

export default function PortfolioPage() {
    const [holdings, setHoldings] = useState<PortfolioItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchPortfolio() {
            try {
                const res = await api.get("/portfolio/")
                setHoldings(res.data)
            } catch (err) {
                console.error("Failed to fetch portfolio:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchPortfolio()
    }, [])

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
    const totalCost = holdings.reduce((sum, h) => sum + h.quantity * h.avg_cost, 0)
    const totalPnL = totalValue - totalCost
    const totalPnLPct = totalCost > 0 ? ((totalPnL / totalCost) * 100).toFixed(2) : "0.00"

    const allocationData = holdings.map((h) => ({
        name: h.symbol,
        value: h.value,
    }))

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6 md:p-10">
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

            {holdings.length === 0 ? (
                <Card className="border-white/10 bg-black/30">
                    <CardContent className="py-16 text-center text-muted-foreground">
                        No assets in portfolio. Add some from the Portfolio tab on the dashboard.
                    </CardContent>
                </Card>
            ) : (
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
                                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Value"]}
                                    />
                                </RechartsPie>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap gap-3 justify-center mt-2">
                                {allocationData.map((item, i) => {
                                    const pct = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : "0"
                                    return (
                                        <div key={item.name} className="flex items-center gap-1.5 text-xs">
                                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            {item.name} ({pct}%)
                                        </div>
                                    )
                                })}
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
                                    const isPositive = h.pnl >= 0
                                    return (
                                        <div key={h.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                            <div>
                                                <p className="font-semibold">{h.symbol}</p>
                                                <p className="text-xs text-muted-foreground">{h.quantity} shares @ ${h.avg_cost.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">${h.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                <div className={`flex items-center gap-1 text-xs justify-end ${isPositive ? "text-green-500" : "text-red-500"}`}>
                                                    {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                    {isPositive ? "+" : ""}${h.pnl.toFixed(2)} ({h.pnl_percent.toFixed(2)}%)
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
