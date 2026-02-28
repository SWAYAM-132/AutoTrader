"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Trophy } from "lucide-react"

interface PredictionItem {
    question: string
    probability: number
    volume: string
    trend: number // Positive or negative trend
}

interface PredictionMarketWidgetProps {
    title: string
    items: PredictionItem[]
}

export function PredictionMarketWidget({ title, items }: PredictionMarketWidgetProps) {
    return (
        <Card className="bg-card/40 border-border/50 hover:border-border transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    {title}
                </CardTitle>
                <span className="text-xs text-muted-foreground">{items.length} markets</span>
            </CardHeader>
            <CardContent className="space-y-4">
                {items.map((item, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex justify-between items-start">
                            <p className="text-sm text-foreground font-medium leading-tight max-w-[80%]">
                                {item.question}
                            </p>
                            <span className="text-xs text-muted-foreground">{item.volume}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${item.probability}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold text-primary w-12 text-right">
                                {item.probability}%
                            </span>
                            <span className={`text-xs w-12 text-right ${item.trend > 0 ? "text-green-500" : "text-red-500"}`}>
                                {item.trend > 0 ? "↑" : "↓"} {Math.abs(item.trend)}%
                            </span>
                        </div>
                    </div>
                ))}
                <div className="pt-2 border-t border-white/5">
                    <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                        View all prediction markets <ArrowRight className="h-3 w-3" />
                    </button>
                </div>
            </CardContent>
        </Card>
    )
}
