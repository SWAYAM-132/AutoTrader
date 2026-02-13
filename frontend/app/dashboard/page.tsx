"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DollarSign, Activity, TrendingUp, ArrowUpRight, ArrowDownRight, Search, Zap } from "lucide-react"
import { PortfolioChart } from "@/components/charts"
import SentimentWidget from "@/components/SentimentWidget"

const recentActivity = [
    { action: "Bought", asset: "AAPL", amount: "+$250.00", time: "Today, 10:42 AM", positive: true },
    { action: "Sold", asset: "BTC", amount: "+$1,200.00", time: "Yesterday, 2:30 PM", positive: true },
    { action: "Bought", asset: "ETH", amount: "-$500.00", time: "Yesterday, 11:15 AM", positive: false },
    { action: "Dividend", asset: "MSFT", amount: "+$32.50", time: "2 days ago", positive: true },
    { action: "Sold", asset: "TSLA", amount: "+$890.00", time: "3 days ago", positive: true },
]

export default function DashboardPage() {
    return (
        <div className="space-y-8 p-6 md:p-10 min-h-screen transition-colors">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <div className="h-1 w-8 bg-primary rounded-full" />
                        <span className="text-[10px] uppercase font-black tracking-[0.3em] text-primary">Intelligence Hub</span>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                        Market <span className="text-primary italic">Alpha</span>
                    </h2>
                    <p className="text-white/70 mt-4 text-lg font-medium flex items-center justify-center md:justify-start gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        Opportunity detected in Growth Phase.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-white/10 bg-black/40 hover:bg-white/5 rounded-xl px-6 h-12 font-bold transition-all">
                        Download Report
                    </Button>
                    <Button className="bg-white text-black hover:bg-white/90 rounded-xl px-8 h-12 font-bold shadow-xl shadow-white/10 transition-all">
                        Invest Now
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
                {[
                    { title: "PORTFOLIO TOTAL", value: "$45,231.89", change: "+20.1%", icon: <DollarSign className="h-5 w-5" />, sub: "FROM $37.5K", glow: "shadow-primary/10" },
                    { title: "ACTIVE POSITIONS", value: "12", change: "+2", icon: <Activity className="h-5 w-5" />, sub: "TOP: BTC/USD", glow: "shadow-green-500/10" },
                    { title: "UNREALIZED GAINS", value: "$8,432.12", change: "+19.2%", icon: <TrendingUp className="h-5 w-5" />, sub: "GROWTH PHASE", glow: "shadow-blue-500/10" },
                    { title: "RISK FACTOR", value: "0.24", change: "-2.1%", icon: <Zap className="h-5 w-5" />, sub: "OPTIMAL SAFETY", glow: "shadow-yellow-500/10" }
                ].map((kpi) => (
                    <Card key={kpi.title} className={cn("bg-black border-white/5 hover:border-white/10 transition-all duration-500 group relative overflow-hidden", kpi.glow)}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">
                                {kpi.title}
                            </CardTitle>
                            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/20 group-hover:text-primary transition-all duration-500">
                                {kpi.icon}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tracking-tight text-white mb-1">{kpi.value}</div>
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{kpi.sub}</p>
                                <Badge variant="outline" className={cn(
                                    "border-none font-black text-xs",
                                    kpi.change.startsWith("+") ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                                )}>
                                    {kpi.change}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts + Activity + Sentiment */}
            <div className="grid gap-6 lg:grid-cols-7">
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-black/40 p-4 overflow-hidden border-white/5 shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Portfolio Alpha
                            </CardTitle>
                        </CardHeader>
                        <PortfolioChart className="h-[350px] border-none shadow-none bg-transparent" />
                    </Card>

                    <SentimentWidget />
                </div>

                <div className="lg:col-span-3">
                    <Card className="bg-black/40 overflow-hidden border-white/5 shadow-2xl h-full">
                        <CardHeader className="border-b border-white/5">
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Activity className="h-5 w-5 text-primary" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                {recentActivity.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl transition-colors ${item.positive ? "bg-green-500/10 group-hover:bg-green-500/20" : "bg-red-500/10 group-hover:bg-red-500/20"}`}>
                                                {item.positive ? (
                                                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{item.action} {item.asset}</p>
                                                <p className="text-xs text-muted-foreground">{item.time}</p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-bold ${item.positive ? "text-green-400" : "text-red-400"}`}>
                                            {item.amount}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
