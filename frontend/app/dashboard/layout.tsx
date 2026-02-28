import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background relative">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_35%)]" />

            <div className="hidden md:block w-64 flex-shrink-0 border-r border-white/5 bg-background/80 backdrop-blur relative z-10">
                <Sidebar />
            </div>

            <div className="flex flex-col flex-1 overflow-hidden relative z-10">
                <Navbar />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
