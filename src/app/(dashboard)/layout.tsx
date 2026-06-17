import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Global Sidebar (Hidden on mobile) */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Global Top Navigation */}
        <TopNav />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-secondary/10">
          {children}
        </main>
      </div>
    </div>
  );
}
