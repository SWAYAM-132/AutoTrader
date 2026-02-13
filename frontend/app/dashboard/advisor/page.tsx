import { ChatInterface } from "@/components/chat-interface"

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
