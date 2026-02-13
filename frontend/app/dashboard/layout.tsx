import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar - hidden on mobile, block on md */}
            <div className="hidden md:block w-64 flex-shrink-0 border-r border-white/5 bg-background">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 overflow-hidden bg-background">
                <Navbar />
                <main className="flex-1 overflow-y-auto bg-background">
                    {children}
                </main>
            </div>
        </div>
    )
}
