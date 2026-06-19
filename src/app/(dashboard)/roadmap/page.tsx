"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Map, Clock, ArrowRight, BookOpen, Target, CheckCircle2, AlertCircle } from "lucide-react";

export default function RoadmapPage() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [isFetchingAnalyses, setIsFetchingAnalyses] = useState(true);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    setIsFetchingAnalyses(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const { data } = await supabase
        .from("ats_analyses")
        .select("*, job_descriptions(company_name, job_title)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setAnalyses(data);
        if (data.length > 0) setSelectedAnalysis(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch analyses:", error);
    } finally {
      setIsFetchingAnalyses(false);
    }
  };

  const generateRoadmap = async () => {
    if (!selectedAnalysis || !selectedAnalysis.missing_skills || selectedAnalysis.missing_skills.length === 0) return;
    
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch("http://localhost:8000/api/v1/roadmap/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          target_role: selectedAnalysis.job_descriptions?.job_title || "Target Role",
          missing_skills: selectedAnalysis.missing_skills,
          ats_analysis_id: selectedAnalysis.id
        })
      });
      
      if (!res.ok) throw new Error("Failed to generate roadmap");
      
      const data = await res.json();
      setRoadmap(data.roadmap);
    } catch (err) {
      console.error(err);
      alert("Error generating roadmap. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Skill Gap Roadmap</h1>
          <p className="text-muted-foreground mt-1">Transform your missing skills into a structured weekly learning plan.</p>
        </div>
      </div>

      {!roadmap ? (
        <div className="bg-white rounded-xl border border-border shadow-sm p-8">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <Map className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Generate Your Learning Path</h2>
              <p className="text-muted-foreground">Select a past ATS Resume scan. The AI will analyze the skills you are missing and generate a personalized curriculum.</p>
            </div>

            {isFetchingAnalyses ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : analyses.length === 0 ? (
              <div className="text-center py-8 bg-secondary/50 rounded-lg border border-border">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-foreground font-medium">No ATS Scans Found</p>
                <p className="text-sm text-muted-foreground mt-1">Run your resume through the ATS Analyzer first to discover your missing skills.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Select an ATS Scan to base your roadmap on:</label>
                  <div className="grid gap-3">
                    {analyses.map((a) => (
                      <div 
                        key={a.id} 
                        onClick={() => setSelectedAnalysis(a)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          selectedAnalysis?.id === a.id 
                            ? "border-primary bg-primary/5 ring-1 ring-primary" 
                            : "border-border hover:border-primary/50 bg-white"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-foreground">{a.job_descriptions?.job_title}</p>
                          <p className="text-sm text-muted-foreground">{a.job_descriptions?.company_name} • Scored {a.overall_score}%</p>
                        </div>
                        {selectedAnalysis?.id === a.id && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedAnalysis && selectedAnalysis.missing_skills?.length > 0 ? (
                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                    <p className="text-sm font-bold text-destructive mb-2">Identified Missing Skills to Learn:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAnalysis.missing_skills.map((skill: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-white border border-destructive/30 text-destructive text-xs font-medium rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : selectedAnalysis && (
                  <div className="bg-success/10 border border-success/20 p-4 rounded-lg text-center">
                    <p className="text-sm text-success font-medium">This resume matched perfectly! No missing skills to learn.</p>
                  </div>
                )}

                <button 
                  onClick={generateRoadmap}
                  disabled={isLoading || !selectedAnalysis || !selectedAnalysis.missing_skills || selectedAnalysis.missing_skills.length === 0}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Generating Curriculum...
                    </>
                  ) : (
                    <>
                      <Map className="w-4 h-4" /> Generate Roadmap
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-8 text-center space-y-4">
            <Target className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Your Personalized Learning Path</h2>
            <p className="text-primary-foreground/80 text-foreground max-w-2xl mx-auto leading-relaxed">
              {roadmap.summary}
            </p>
            <button 
              onClick={() => setRoadmap(null)}
              className="text-sm font-medium text-primary hover:underline mt-4 inline-block"
            >
              ← Generate a different roadmap
            </button>
          </div>

          <div className="space-y-6">
            {roadmap.weeks.map((week: any, wIndex: number) => (
              <div key={wIndex} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="bg-secondary/50 border-b border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-bold text-primary tracking-wider uppercase">Week {week.week_number}</span>
                    <h3 className="text-xl font-bold text-foreground mt-1">{week.focus}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium bg-white px-3 py-1.5 rounded-full border border-border">
                    <Clock className="w-4 h-4" />
                    {week.tasks.reduce((acc: number, task: any) => acc + task.estimated_hours, 0)} hours total
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {week.tasks.map((task: any, tIndex: number) => (
                    <div key={tIndex} className="p-6 hover:bg-secondary/20 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                          {tIndex + 1}
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h4 className="font-bold text-foreground text-lg">{task.title}</h4>
                            <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded-md border border-border whitespace-nowrap">
                              ~{task.estimated_hours} hrs
                            </span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{task.description}</p>
                          
                          {task.resources && task.resources.length > 0 && (
                            <div className="pt-3 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-foreground flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5 text-primary" /> Resources:
                              </span>
                              {task.resources.map((res: string, rIndex: number) => (
                                <span key={rIndex} className="text-xs px-2.5 py-1 bg-white border border-border rounded-full text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-default">
                                  {res}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
