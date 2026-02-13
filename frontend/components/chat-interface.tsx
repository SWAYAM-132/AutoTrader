"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Loader2 } from "lucide-react"
import api from "@/lib/api"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
    role: "user" | "ai"
    content: string
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", content: "Hello! I am your AI Financial Advisor. How can I help you today?" }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMessage: Message = { role: "user", content: input }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setIsLoading(true)

        try {
            const response = await api.post("/advisor/chat", { query: userMessage.content })
            const aiMessage: Message = { role: "ai", content: response.data.response }
            setMessages(prev => [...prev, aiMessage])
        } catch (error) {
            console.error(error)
            setMessages(prev => [...prev, { role: "ai", content: "Sorry, I encountered an error. Please try again." }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="h-[600px] flex flex-col glass-card border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-gradient opacity-50" />
            <CardHeader className="border-b border-white/5 py-4">
                <CardTitle className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-xl">
                        <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-lg font-bold tracking-tight">AutoTraderX Advisor</p>
                        <p className="text-[10px] uppercase tracking-widest text-primary font-bold opacity-70">AI-Powered Intelligence</p>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 bg-background/20">
                <ScrollArea className="h-full p-4">
                    <div className="space-y-6">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.role === "ai" && (
                                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                                        <AvatarFallback>AI</AvatarFallback>
                                        <AvatarImage src="/bot-avatar.png" />
                                    </Avatar>
                                )}
                                <div
                                    className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm shadow-sm ${msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-card/50 backdrop-blur-md border border-white/10 rounded-tl-none"
                                        }`}
                                >
                                    {msg.role === "ai" ? (
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                    h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-2 mt-4 text-primary" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-black text-primary/90" {...props} />,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                                {msg.role === "user" && (
                                    <Avatar className="h-9 w-9 border-2 border-white/10">
                                        <AvatarFallback>ME</AvatarFallback>
                                        <AvatarImage src="/user-avatar.png" />
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 justify-start items-center">
                                <Avatar className="h-9 w-9 border-2 border-primary/20 animate-pulse">
                                    <AvatarFallback>AI</AvatarFallback>
                                </Avatar>
                                <div className="bg-card/30 backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-none px-4 py-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 bg-background/40 backdrop-blur-xl border-t border-white/5">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleSend()
                    }}
                    className="flex w-full gap-3"
                >
                    <Input
                        placeholder="Ask about stocks, crypto, or market trends..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        className="bg-background/20 border-white/10 rounded-xl h-12 focus:ring-primary/40 transition-all"
                    />
                    <Button type="submit" size="icon" disabled={isLoading} className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Send className="h-5 w-5" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}
