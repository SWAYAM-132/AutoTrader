"use client"

import { useEffect, useState } from "react"
import { ResponsiveContainer, Treemap, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import api from "@/lib/api"

// Sector groupings for the heatmap
const SECTOR_SYMBOLS: Record<string, string[]> = {
    Technology: ["NVDA", "MSFT", "AAPL", "GOOGL", "META"],
    Financials: ["JPM", "V", "MA", "GS"],
    Healthcare: ["LLY", "JNJ", "UNH"],
    Consumer: ["AMZN", "TSLA", "WMT"],
}

interface HeatmapItem {
    name: string
    children: { name: string; size: number; change: number }[]
}

const COLORS = {
    positive: {
        high: "oklch(0.5 0.2 140)",
        mid: "oklch(0.6 0.15 140)",
        low: "oklch(0.7 0.1 140)",
    },
    negative: {
        high: "oklch(0.5 0.2 30)",
        mid: "oklch(0.6 0.15 30)",
        low: "oklch(0.7 0.1 30)",
    },
    neutral: "oklch(0.3 0 0)",
}

const CustomizedContent = (props: any) => {
    const { depth, x, y, width, height, payload, name } = props

    if (!payload || depth < 2) return null

    const getColor = (change: number) => {
        if (!change) return COLORS.neutral
        if (change > 3) return COLORS.positive.high
        if (change > 1) return COLORS.positive.mid
        if (change > 0) return COLORS.positive.low
        if (change < -3) return COLORS.negative.high
        if (change < -1) return COLORS.negative.mid
        return COLORS.negative.low
    }

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: getColor(payload.change || 0),
                    stroke: "#fff",
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            {width > 30 && height > 30 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={Math.min(width / 4, 14)}
                    fontWeight="bold"
                >
                    {name}
                </text>
            )}
            {width > 30 && height > 30 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 14}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.8)"
                    fontSize={Math.min(width / 6, 10)}
                >
                    {payload.change > 0 ? "+" : ""}
                    {payload.change}%
                </text>
            )}
        </g>
    )
}

export function MarketHeatmap() {
    const [data, setData] = useState<HeatmapItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchHeatmapData()
    }, [])

    async function fetchHeatmapData() {
        setLoading(true)
        setError(null)

        try {
            const sectorData: HeatmapItem[] = []

            for (const [sector, symbols] of Object.entries(SECTOR_SYMBOLS)) {
                const children: { name: string; size: number; change: number }[] = []

                const results = await Promise.allSettled(
                    symbols.map((sym) => api.get(`/market/sentiment/${sym}`))
                )

                for (const result of results) {
                    if (result.status === "fulfilled") {
                        const d = result.value.data
                        children.push({
                            name: d.symbol,
                            size: Math.max(Math.abs(d.price) * 10, 500),
                            change: d.change_percent || 0,
                        })
                    }
                }

                if (children.length > 0) {
                    sectorData.push({ name: sector, children })
                }
            }

            setData(sectorData)
        } catch (err) {
            console.error("Failed to fetch heatmap data:", err)
            setError("Failed to load market data")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Card className="bg-card/40 border-border/50 h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm">Loading market data...</p>
                </div>
            </Card>
        )
    }

    if (error || data.length === 0) {
        return (
            <Card className="bg-card/40 border-border/50 h-[400px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">{error || "No market data available"}</p>
            </Card>
        )
    }

    return (
        <Card className="bg-card/40 border-border/50 overflow-hidden">
            <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                    Market Map (S&P 500)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ResponsiveContainer width="100%" height={340}>
                    <Treemap
                        data={data}
                        dataKey="size"
                        stroke="#fff"
                        fill="#8884d8"
                        content={<CustomizedContent />}
                    >
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload
                                    return (
                                        <div className="bg-black/90 border border-white/10 p-2 rounded shadow-xl">
                                            <p className="font-bold text-white">{data.name}</p>
                                            <p
                                                className={`text-sm ${data.change > 0 ? "text-green-400" : "text-red-400"}`}
                                            >
                                                Change: {data.change > 0 ? "+" : ""}
                                                {data.change}%
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Vol: {data.size}M
                                            </p>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                    </Treemap>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
