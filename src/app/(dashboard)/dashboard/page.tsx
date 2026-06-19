import { ArrowUpRight, BarChart, FileText, CheckCircle, Briefcase } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Fetch real data for the dashboard
  let avgAtsScore = 0;
  let totalAnalyses = 0;
  let totalCoverLetters = 0;
  let avgInterviewScore = 0;
  let recentActivity: any[] = [];

  if (session) {
    const { data: analyses } = await supabase
      .from("ats_analyses")
      .select("*, job_descriptions(company_name, job_title)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    const { data: coverLetters } = await supabase
      .from("cover_letters")
      .select("*, job_descriptions(company_name, job_title)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    const { data: interviews } = await supabase
      .from("interviews")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (analyses && analyses.length > 0) {
      totalAnalyses = analyses.length;
      avgAtsScore = Math.round(analyses.reduce((acc: any, curr: any) => acc + curr.overall_score, 0) / totalAnalyses);
      
      analyses.forEach((a: any) => {
        recentActivity.push({
          type: "ats",
          title: "Resume Analyzed",
          desc: `Scored ${a.overall_score}% for ${a.job_descriptions?.job_title || 'a role'} at ${a.job_descriptions?.company_name || 'a company'}.`,
          date: new Date(a.created_at)
        });
      });
    }

    if (coverLetters && coverLetters.length > 0) {
      totalCoverLetters = coverLetters.length;
      
      coverLetters.forEach((c: any) => {
        recentActivity.push({
          type: "cl",
          title: "Cover Letter Generated",
          desc: `For ${c.job_descriptions?.job_title || 'a role'} at ${c.job_descriptions?.company_name || 'a company'}.`,
          date: new Date(c.created_at)
        });
      });
    }

    if (interviews && interviews.length > 0) {
      avgInterviewScore = Math.round(interviews.reduce((acc: any, curr: any) => acc + curr.overall_score, 0) / interviews.length);
      
      interviews.forEach((i: any) => {
        recentActivity.push({
          type: "interview",
          title: "Mock Interview Completed",
          desc: `Scored ${i.overall_score}/100 for the ${i.job_title} role.`,
          date: new Date(i.created_at)
        });
      });
    }

    // Sort combined activity by date descending
    recentActivity.sort((a, b) => b.date.getTime() - a.date.getTime());
    recentActivity = recentActivity.slice(0, 5); // Take top 5
  }

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
              href="/mock-interview" 
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
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-4">
            <h3 className="font-medium text-muted-foreground text-sm">Avg ATS Score</h3>
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-foreground">{avgAtsScore > 0 ? `${avgAtsScore}%` : '--'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-4">
            <h3 className="font-medium text-muted-foreground text-sm">Resumes Analyzed</h3>
            <BarChart className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-foreground">{totalAnalyses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-4">
            <h3 className="font-medium text-muted-foreground text-sm">Cover Letters</h3>
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-foreground">{totalCoverLetters}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-4">
            <h3 className="font-medium text-muted-foreground text-sm">Interview Readiness</h3>
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-foreground">
                {typeof avgInterviewScore !== 'undefined' && avgInterviewScore > 0 ? `${avgInterviewScore}%` : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Recent Activity</h2>
          <button className="text-sm text-primary font-medium hover:underline">View All</button>
        </div>
        <div className="p-6 space-y-6">
          {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary mt-1.5"></div>
                {i !== recentActivity.length - 1 && <div className="w-[1px] h-full bg-border my-1"></div>}
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">{activity.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {activity.date.toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{activity.desc}</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No activity yet. Run your first ATS scan to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
