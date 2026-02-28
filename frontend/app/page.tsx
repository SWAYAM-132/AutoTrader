"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowRight, BarChart2, ShieldCheck, Zap, TrendingUp, Globe, Cpu, Search, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Logo } from "@/components/Logo"
import { Input } from "@/components/ui/input"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-hidden selection:bg-primary/30 font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[160px] animate-pulse" />
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <header className="relative z-50 px-6 lg:px-12 h-20 flex items-center border-b border-border/40 bg-background/50 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">AutoTrader<span className="text-primary">X</span></span>
        </div>
        <nav className="ml-auto flex gap-8 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/login">
            Log In
          </Link>
          <Link href="/signup">
            <Button className="rounded-lg px-6 font-bold shadow-lg shadow-primary/20 transition-all">
              Sign Up
            </Button>
          </Link>
        </nav>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-20 pb-40">

        {/* Hero Section */}
        <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4 max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide uppercase mb-4">
              <Sparkles className="h-3 w-3" />
              v1.0 Intelligence Engine Live
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
              Where the world <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">queries the market.</span>
            </h1>
            <p className="max-w-[600px] mx-auto text-xl text-muted-foreground">
              Real-time liquidity, sentiment analysis, and predictive modeling for the modern investor.
            </p>
          </motion.div>

          {/* Real Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-2xl relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-all duration-500" />
            <div className="relative bg-card border border-white/10 rounded-2xl p-4 flex items-center shadow-2xl backdrop-blur-xl">
              <Search className="h-6 w-6 text-muted-foreground ml-2 mr-4" />
              <input
                type="text"
                placeholder="Ask anything... e.g. 'Why is NVDA down today?'"
                className="bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground/50 w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    window.location.href = "/signup"
                  }
                }}
              />
              <div className="hidden md:flex items-center gap-2 ml-4">
                <div className="bg-white/5 px-2 py-1 rounded text-xs text-muted-foreground border border-white/5">Focus</div>
                <div className="bg-white/5 px-2 py-1 rounded text-xs text-muted-foreground border border-white/5">Attach</div>
              </div>
              <Button size="icon" className="ml-2 rounded-xl h-10 w-10" onClick={() => window.location.href = "/signup"}>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Suggested Queries */}
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {["What is the sentiment on AAPL?", "Predict BTC price for next week", "Show me high-growth tech stocks"].map((q, i) => (
                <div
                  key={i}
                  className="px-4 py-2 rounded-lg bg-card/40 border border-white/5 hover:bg-white/10 hover:border-white/10 cursor-pointer transition-colors text-sm text-muted-foreground"
                  onClick={() => window.location.href = "/signup"}
                >
                  {q}
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-12 px-6 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs text-muted-foreground">
            © 2026 AUTOTRADERX. BUILT FOR THE FUTURE.
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground font-medium">
            <button className="hover:text-primary transition-colors cursor-default">Privacy</button>
            <button className="hover:text-primary transition-colors cursor-default">Terms</button>
            <Link href="#" className="hover:text-primary transition-colors">X</Link>
            <Link href="#" className="hover:text-primary transition-colors">Discord</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
