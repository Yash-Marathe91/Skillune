import { Bell, Search } from "lucide-react";

export function TopNav() {
  return (
    <header className="h-[72px] bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden md:flex text-sm text-muted-foreground">
          Dashboard <span className="mx-2">/</span> Overview
        </div>
        
        <div className="flex-1 max-w-xl mx-auto md:mx-0 md:ml-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search resumes, jobs, interviews..." 
            className="w-full h-10 pl-10 pr-4 rounded-md border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <span>150</span> Credits
        </div>
        <button className="relative p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary cursor-pointer">
          U
        </div>
      </div>
    </header>
  );
}
