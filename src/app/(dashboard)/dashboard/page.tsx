import { ArrowUpRight, BarChart, FileText, CheckCircle, Briefcase } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="bg-white rounded-xl border border-border p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Welcome back to <span className="text-primary">Skillune</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Optimize your resume, improve ATS performance, and prepare for interviews with AI-powered insights.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <Link 
              href="/resume-analyzer" 
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              Analyze Resume
            </Link>
            <Link 
              href="/interview-prep" 
              className="bg-white text-foreground border border-border px-6 py-3 rounded-md font-medium hover:bg-secondary transition-colors"
            >
              Start Interview Prep
            </Link>
          </div>
        </div>
        
        <div className="hidden md:block w-48 h-48 bg-secondary rounded-2xl border border-border shrink-0 flex items-center justify-center relative shadow-sm">
          {/* Minimal illustration placeholder */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <BarChart className="w-24 h-24 text-primary" />
          </div>
          <div className="w-16 h-20 bg-white shadow-sm rounded-md border border-border z-10 -rotate-6 translate-x-4"></div>
          <div className="w-16 h-20 bg-white shadow-sm rounded-md border border-border z-20 rotate-3 -translate-x-4"></div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "ATS Score", value: "87%", trend: "+12%", icon: CheckCircle, trendUp: true },
          { label: "Skills Matched", value: "24", trend: "+3", icon: BarChart, trendUp: true },
          { label: "Interview Readiness", value: "Good", trend: "Improving", icon: Briefcase, trendUp: true },
          { label: "Applications Optimized", value: "12", trend: "+4 this week", icon: FileText, trendUp: true },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-4">
              <h3 className="font-medium text-muted-foreground text-sm">{kpi.label}</h3>
              <kpi.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">{kpi.trend}</span>
                </div>
              </div>
              <div className="w-16 h-8 bg-secondary/50 rounded-sm"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Recent Activity</h2>
          <button className="text-sm text-primary font-medium hover:underline">View All</button>
        </div>
        <div className="p-6 space-y-6">
          {[
            { title: "Resume Analyzed", time: "2 hours ago", desc: "Software Engineer resume scored 87% for Google." },
            { title: "Mock Interview Completed", time: "Yesterday", desc: "System Design interview. Confidence score: 92%." },
            { title: "Cover Letter Generated", time: "3 days ago", desc: "Frontend Developer position at Vercel." },
            { title: "Skill Gap Report Created", time: "1 week ago", desc: "Identified Docker and AWS as missing skills." },
          ].map((activity, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary mt-1.5"></div>
                {i !== 3 && <div className="w-[1px] h-full bg-border my-1"></div>}
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">{activity.title}</h4>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{activity.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
