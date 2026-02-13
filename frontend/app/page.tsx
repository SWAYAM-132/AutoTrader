"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowRight, BarChart2, ShieldCheck, Zap, TrendingUp, Globe, Cpu } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Logo } from "@/components/Logo"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white overflow-hidden selection:bg-primary/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[160px] animate-pulse" />
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <header className="relative z-50 px-6 lg:px-12 h-20 flex items-center border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <Logo />
        <nav className="ml-auto flex gap-8 items-center">
          <Link className="text-sm font-black tracking-[0.1em] uppercase hover:text-primary transition-colors" href="#features">
            Features
          </Link>
          <Link className="text-sm font-black tracking-[0.1em] uppercase hover:text-primary transition-colors" href="/login">
            Login
          </Link>
          <Link href="/signup">
            <Button className="rounded-xl px-8 bg-white text-black hover:bg-white/90 font-black shadow-xl shadow-white/10 transition-all">
              Join Now
            </Button>
          </Link>
        </nav>
      </header>

      <main className="relative z-10 flex-1">
        {/* Ticker simulation */}
        <div className="w-full bg-white/5 border-b border-white/5 py-2 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee uppercase font-black text-[10px] tracking-[0.2em] space-x-12 px-12">
            {[
              { s: "BTC/USD", p: "$45,231.89", c: "+2.4%" },
              { s: "AAPL", p: "$182.52", c: "+1.2%" },
              { s: "ETH/USD", p: "$2,412.12", c: "-0.8%" },
              { s: "TSLA", p: "$195.10", c: "+4.5%" },
              { s: "MSFT", p: "$402.12", c: "+0.1%" },
              { s: "NVDA", p: "$721.33", c: "+6.2%" },
            ].map((t, idx) => (
              <span key={idx} className="inline-flex items-center gap-2">
                <span className="text-white/40">{t.s}</span>
                <span className="text-white">{t.p}</span>
                <span className={t.c.startsWith("+") ? "text-green-400" : "text-red-400"}>{t.c}</span>
              </span>
            ))}
          </div>
        </div>

        <section className="w-full py-20 lg:py-40 flex items-center justify-center">
          <div className="container px-6 mx-auto">
            <div className="flex flex-col items-center text-center space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6 max-w-4xl"
              >
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 w-fit backdrop-blur-sm mx-auto">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span className="text-[10px] font-black text-primary tracking-[0.3em] uppercase">V2.0 Intelligence Now Live</span>
                </div>
                <h1 className="text-7xl lg:text-9xl font-black tracking-tighter leading-[0.9] text-white">
                  Trade with <span className="text-primary italic">Absolute</span> Alpha
                </h1>
                <p className="max-w-[700px] mx-auto text-xl text-white/60 font-medium leading-relaxed">
                  The world's first sentiment-integrated trading terminal for serious investors.
                  predictive analysis meets real-time market alpha.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                  <Link href="/signup">
                    <Button size="lg" className="rounded-2xl px-12 h-16 text-xl font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl shadow-primary/40 transition-all active:scale-95">
                      GET STARTED
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" className="rounded-2xl px-12 h-16 text-xl font-black border-white/10 bg-black/40 hover:bg-white/10 transition-all backdrop-blur-xl">
                    WATCH DEMO
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 100, rotateX: 20 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                style={{ perspective: "2000px" }}
                className="w-full max-w-6xl relative"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-[3rem] blur-[120px] -z-10 animate-pulse scale-90" />
                <div className="relative border border-white/10 rounded-[2.5rem] bg-black/60 backdrop-blur-3xl p-1 shadow-[0_0_100px_rgba(var(--primary),0.1)] group">
                  <div className="rounded-[2.4rem] overflow-hidden">
                    <Image
                      src="/hero.png"
                      alt="Premium Dashboard"
                      width={1200}
                      height={800}
                      className="w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity duration-700"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-32 bg-black relative">
          <div className="absolute inset-0 bg-primary/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          <div className="container px-6 mx-auto relative">
            <div className="text-center space-y-6 mb-24 max-w-3xl mx-auto">
              <h2 className="text-5xl lg:text-6xl font-black tracking-tighter text-white">
                Elite <span className="text-primary">Intelligence</span> Suite
              </h2>
              <p className="text-white/60 text-xl font-medium">
                Military-grade tools repurposed for the modern alpha seeker.
                Data-driven precision at your fingertips.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "Sentiment Engine",
                  desc: "Analyzes 10k+ data points per second across global news and social feeds using custom NLP.",
                  icon: Cpu,
                  glow: "shadow-blue-500/10",
                  tag: "REAL-TIME"
                },
                {
                  title: "Predictive Signals",
                  desc: "Leverages deep learning models to project market movements before they happen.",
                  icon: Zap,
                  glow: "shadow-primary/10",
                  tag: "AI-POWERED"
                },
                {
                  title: "Global Liquidity",
                  desc: "Connect to every major exchange and dark pool with sub-millisecond execution speeds.",
                  icon: Globe,
                  glow: "shadow-green-500/10",
                  tag: "INFRASTRUCTURE"
                },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className={cn(
                    "group relative p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500",
                    f.glow
                  )}
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-all duration-500">
                      <f.icon className="h-8 w-8" />
                    </div>
                    <span className="text-[10px] font-black tracking-[0.2em] text-white/30 group-hover:text-primary transition-colors">{f.tag}</span>
                  </div>
                  <h3 className="text-2xl font-black mb-4 tracking-tight text-white">{f.title}</h3>
                  <p className="text-white/50 leading-relaxed font-medium">{f.desc}</p>

                  <div className="mt-8 pt-6 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-primary font-black text-sm cursor-pointer">
                    LEARN MORE <ArrowRight className="h-4 w-4" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-32 border-t border-white/5 bg-black">
          <div className="container px-6 mx-auto">
            <div className="bg-gradient-to-r from-primary to-accent rounded-[3rem] p-12 lg:p-24 text-center space-y-8 relative overflow-hidden shadow-2xl shadow-primary/20">
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
              <div className="relative z-10 space-y-8">
                <h2 className="text-5xl lg:text-7xl font-black tracking-tighter text-white">
                  Ready to gain the <span className="italic underline decoration-black/30 underline-offset-8">edge</span>?
                </h2>
                <p className="text-white/80 text-xl font-bold max-w-2xl mx-auto">
                  Join the elite circle of traders using AutoTraderX to outpace the market every single day.
                </p>
                <Link href="/signup" className="inline-block">
                  <Button size="lg" className="rounded-2xl px-16 h-20 text-2xl font-black bg-black text-white hover:bg-black/80 transition-all shadow-2xl">
                    JOIN THE ALPHA
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-24 px-6 lg:px-12 bg-black">
        <div className="container mx-auto grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2 space-y-6">
            <Logo />
            <p className="text-white/40 max-w-sm font-medium">
              Advanced sentiment-driven trading terminal for the next generation of institutional-grade individual investors.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-black tracking-[0.2em] uppercase text-white mb-6">Product</h4>
            <ul className="space-y-4 text-sm font-bold text-white/40">
              <li className="hover:text-primary cursor-pointer transition-colors">Features</li>
              <li className="hover:text-primary cursor-pointer transition-colors">API</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Strategy Builder</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black tracking-[0.2em] uppercase text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm font-bold text-white/40">
              <li className="hover:text-primary cursor-pointer transition-colors">About</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Discord</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Privacy</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black tracking-[0.2em] text-white/20 uppercase">
            © 2024 AUTOTRADERX. BUILT FOR ELITE PERFORMANCE.
          </p>
          <div className="flex gap-8 text-[10px] font-black tracking-[0.2em] text-white/20 uppercase">
            <span>Systems Normal</span>
            <span className="text-green-500">Online</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
