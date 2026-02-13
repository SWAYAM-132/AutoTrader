"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, TrendingUp, TrendingDown, Minus, Zap } from "lucide-react"
import api from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"

export default function SentimentWidget() {
    const [symbol, setSymbol] = useState("")
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const fetchSentiment = async () => {
        if (!symbol) return
        setLoading(true)
        setError(null)
        try {
            const response = await api.get(`/market/sentiment/${symbol}`)
            setData(response.data)
        } catch (err: any) {
            setError("Failed to fetch sentiment.")
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="bg-card/40 border-white/5 hover:border-white/10 shadow-2xl overflow-hidden h-full rounded-[2.5rem] transition-all duration-500 group">
            <CardHeader className="pb-6 border-b border-white/5 bg-white/5">
                <CardTitle className="text-2xl font-black tracking-tighter flex items-center gap-3 text-white">
                    <div className="p-2 bg-primary/20 rounded-xl group-hover:scale-110 transition-transform">
                        <Zap className="h-5 w-5 text-primary" />
                    </div>
                    Market Sentiment
                </CardTitle>
                <CardDescription className="text-muted-foreground font-medium">Predictive analysis powered by real-time NLP.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 mb-6">
                    <Input
                        placeholder="Enter symbol (e.g. AAPL)"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && fetchSentiment()}
                        className="bg-background/20 border-white/10 rounded-xl"
                    />
                    <Button onClick={fetchSentiment} disabled={loading} className="rounded-xl">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze"}
                    </Button>
                </div>

                <AnimatePresence mode="wait">
                    {data ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 group-hover:border-primary/20 transition-all">
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Sentiment Score</p>
                                    <p className="text-4xl font-black tracking-tight text-white">{Math.round(data.score * 100)}%</p>
                                </div>
                                <Badge variant={data.sentiment === "Positive" ? "default" : data.sentiment === "Negative" ? "destructive" : "secondary"} className="h-10 px-6 rounded-2xl text-xs font-black tracking-widest uppercase">
                                    {data.sentiment}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                                    <p className="text-[10px] text-muted-foreground mb-2 uppercase font-black tracking-widest">Recommendation</p>
                                    <div className="flex items-center gap-2">
                                        {data.recommendation === "Buy" && <TrendingUp className="h-5 w-5 text-green-400" />}
                                        {data.recommendation === "Sell" && <TrendingDown className="h-5 w-5 text-red-400" />}
                                        {data.recommendation === "Hold" && <Minus className="h-5 w-5 text-yellow-400" />}
                                        <p className="text-xl font-black text-white">{data.recommendation}</p>
                                    </div>
                                </div>
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                                    <p className="text-[10px] text-muted-foreground mb-2 uppercase font-black tracking-widest">Articles Analyzed</p>
                                    <p className="text-xl font-black text-white">{data.article_count}</p>
                                </div>
                            </div>

                            {data.reason && (
                                <p className="text-xs text-muted-foreground italic text-center mt-2">
                                    {data.reason}
                                </p>
                            )}
                        </motion.div>
                    ) : (
                        !loading && !error && (
                            <div className="flex flex-col items-center justify-center py-8 opacity-40">
                                <TrendingUp className="h-12 w-12 mb-2" />
                                <p className="text-sm">Search for a ticker to see insights</p>
                            </div>
                        )
                    )}
                    {error && (
                        <div className="text-sm text-red-400 text-center py-4 bg-red-400/10 rounded-xl border border-red-400/20">
                            {error}
                        </div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    )
}
