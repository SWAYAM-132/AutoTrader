"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, TrendingUp, PieChart as PieChartIcon } from "lucide-react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

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

const COLORS = ["#00f2ea", "#ff0055", "#ffe600", "#9dff00", "#7a00ff"]

export function PortfolioView() {
    const [items, setItems] = useState<PortfolioItem[]>([])
    const [loading, setLoading] = useState(true)
    const [newSymbol, setNewSymbol] = useState("")
    const [newQty, setNewQty] = useState("")
    const [newCost, setNewCost] = useState("")
    const { toast } = useToast()

    const fetchPortfolio = async () => {
        setLoading(true)
        try {
            const res = await api.get("/portfolio/")
            setItems(res.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPortfolio()
    }, [])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSymbol || !newQty || !newCost) return

        try {
            await api.post("/portfolio/", {
                symbol: newSymbol.toUpperCase(),
                quantity: parseFloat(newQty),
                avg_cost: parseFloat(newCost)
            })
            setNewSymbol("")
            setNewQty("")
            setNewCost("")
            fetchPortfolio()
            toast({ title: "Asset Added" })
        } catch (e) {
            toast({ title: "Error adding asset", variant: "destructive" })
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/portfolio/${id}`)
            fetchPortfolio()
        } catch (e) {
            toast({ title: "Error deleting asset", variant: "destructive" })
        }
    }

    const totalValue = items.reduce((acc, item) => acc + item.value, 0)
    const totalCost = items.reduce((acc, item) => acc + (item.quantity * item.avg_cost), 0)
    const totalPnL = totalValue - totalCost

    const allocationData = items.map(i => ({ name: i.symbol, value: i.value }))

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card/40 border-white/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Net Worth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/40 border-white/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Total P&L</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/40 border-white/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Holdings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{items.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart & Add Form */}
                <div className="space-y-6">
                    <Card className="bg-card/40 border-white/5">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <PieChartIcon className="h-4 w-4" /> Allocation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px]">
                            {items.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={allocationData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                                            {allocationData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#000", borderColor: "#333", borderRadius: "8px" }}
                                            itemStyle={{ color: "#fff" }}
                                            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Value"]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>}
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 border-white/5">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold">Add Asset</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAdd} className="space-y-3">
                                <Input placeholder="Symbol (e.g. AAPL)" value={newSymbol} onChange={e => setNewSymbol(e.target.value)} className="bg-white/5 border-white/10" />
                                <div className="flex gap-2">
                                    <Input placeholder="Qty" type="number" step="any" value={newQty} onChange={e => setNewQty(e.target.value)} className="bg-white/5 border-white/10" />
                                    <Input placeholder="Avg Cost" type="number" step="any" value={newCost} onChange={e => setNewCost(e.target.value)} className="bg-white/5 border-white/10" />
                                </div>
                                <Button type="submit" size="sm" className="w-full bg-white/10 hover:bg-white/20">
                                    <Plus className="h-4 w-4 mr-2" /> Add Position
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-white/5 hover:border-white/10 transition-colors">
                            <div>
                                <h4 className="font-bold text-lg">{item.symbol}</h4>
                                <p className="text-xs text-muted-foreground">{item.quantity} shares @ ${item.avg_cost}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                <div className={`text-xs ${item.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)} ({item.pnl_percent.toFixed(2)}%)
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-red-400 hover:bg-red-900/10">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {items.length === 0 && !loading && (
                        <div className="text-center text-muted-foreground py-10">
                            No assets in portfolio. Add one to get started.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
