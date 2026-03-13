import { AuthGuard } from "@/components/layout/AuthGuard";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="mobile-container">
                <TopBar />
                <main
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "18px 16px 90px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    {children}
                </main>
                <BottomNav />
            </div>
        </AuthGuard>
    );
}