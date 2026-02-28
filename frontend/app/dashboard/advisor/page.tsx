"use client"

import dynamic from "next/dynamic"

const ChatInterface = dynamic(
    () => import("@/components/chat-interface").then((mod) => mod.ChatInterface),
    {
        ssr: false,
        loading: () => (
            <div className="h-[600px] bg-card/40 animate-pulse rounded-xl border border-white/5" />
        ),
    }
)

export default function AdvisorPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">AI Financial Advisor</h3>
                <p className="text-sm text-muted-foreground">
                    Ask questions about your portfolio, market trends, or specific assets.
                </p>
            </div>
            <div className="max-w-4xl mx-auto">
                <ChatInterface />
            </div>
        </div>
    )
}
