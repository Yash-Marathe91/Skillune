import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Global Sidebar (Hidden on mobile) */}
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Global Top Navigation */}
        <TopNav user={user} />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-secondary/10">
          {children}
        </main>
      </div>
    </div>
  );
}
