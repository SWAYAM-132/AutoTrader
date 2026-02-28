"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { createPortal } from "react-dom"

export function Toaster() {
    const { toasts } = useToast()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast, i) => (
                <div
                    key={i}
                    className={`rounded-lg border p-4 shadow-lg transition-all ${toast.variant === "destructive"
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-background text-foreground border-border"
                        }`}
                >
                    {toast.title && <div className="font-bold">{toast.title}</div>}
                    {toast.description && <div className="text-sm">{toast.description}</div>}
                </div>
            ))}
        </div>,
        document.body
    )
}

