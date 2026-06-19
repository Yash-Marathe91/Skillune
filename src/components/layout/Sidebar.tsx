import Link from "next/link";
import { 
  LayoutDashboard, 
  FileText, 
  CheckCircle, 
  BarChart, 
  PenTool, 
  Briefcase, 
  MessageSquare, 
  Mic, 
  FileEdit, 
  History, 
  Settings,
  Map,
  User as UserIcon
} from "lucide-react";

import { User } from "@supabase/supabase-js";

export function Sidebar({ user }: { user: User }) {
  // Extract user details (email, phone, or github name)
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || user.phone || "User";
  const displayEmail = user.email || user.phone || "No contact info";
  const initial = displayName.charAt(0).toUpperCase();
  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Resume Analyzer", href: "/resume-analyzer", icon: FileText },
    { name: "Learning Roadmap", href: "/roadmap", icon: Map },
    { name: "Resume Optimizer", href: "/resume-optimizer", icon: PenTool },
    { name: "Interview Prep", href: "/interview-prep", icon: Briefcase },
    { name: "Mock Interview", href: "/mock-interview", icon: MessageSquare },
    { name: "Cover Letter Generator", href: "/cover-letter", icon: FileEdit },
    { name: "Profile", href: "/profile", icon: UserIcon },
    { name: "History", href: "/history", icon: History },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-[260px] h-full bg-white border-r border-border flex flex-col hidden md:flex shrink-0 z-10 sticky top-0">
      <div className="h-[72px] flex items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white">
            S
          </div>
          Skillune
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-secondary-foreground hover:bg-secondary hover:text-primary transition-colors"
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/50">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary uppercase">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
