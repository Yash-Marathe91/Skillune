"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { History as HistoryIcon, MessageSquare, Map, Calendar, ChevronRight, Clock, Award } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"interviews" | "roadmaps">("interviews");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;

        const res = await fetch("http://localhost:8000/api/v1/history", {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (!res.ok) throw new Error("Failed to fetch history");
        
        const data = await res.json();
        setInterviews(data.data.interviews || []);
        setRoadmaps(data.data.roadmaps || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
          <HistoryIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your History</h1>
          <p className="text-muted-foreground mt-1">
            Review your past mock interviews and generated learning roadmaps.
          </p>
        </div>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("interviews")}
          className={`px-6 py-4 font-medium text-sm transition-colors relative ${activeTab === 'interviews' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Mock Interviews
          <span className="ml-2 bg-secondary text-xs px-2 py-0.5 rounded-full">{interviews.length}</span>
          {activeTab === 'interviews' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("roadmaps")}
          className={`px-6 py-4 font-medium text-sm transition-colors relative ${activeTab === 'roadmaps' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Learning Roadmaps
          <span className="ml-2 bg-secondary text-xs px-2 py-0.5 rounded-full">{roadmaps.length}</span>
          {activeTab === 'roadmaps' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
          )}
        </button>
      </div>

      <div className="pt-4">
        {activeTab === "interviews" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interviews.length === 0 ? (
              <div className="col-span-full py-12 text-center border border-dashed border-border rounded-2xl bg-secondary/20">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No interviews yet</h3>
                <p className="text-muted-foreground mb-6">You haven't completed any mock interviews.</p>
                <Link href="/mock-interview" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Start an Interview
                </Link>
              </div>
            ) : (
              interviews.map((interview) => (
                <div key={interview.id} className="bg-white rounded-2xl border border-border shadow-sm p-6 hover:border-primary/50 transition-colors group cursor-pointer flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-xl font-bold ${interview.overall_score >= 80 ? 'text-green-600' : interview.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {interview.overall_score}%
                      </span>
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Score</span>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-foreground text-lg line-clamp-1">{interview.job_title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(interview.created_at)}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border flex justify-between items-center mt-auto">
                    <div className="flex gap-2">
                      {interview.technical_score && (
                        <span className="text-xs bg-secondary px-2 py-1 rounded-md font-medium text-foreground" title="Technical Score">
                          Tech: {interview.technical_score}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "roadmaps" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roadmaps.length === 0 ? (
              <div className="col-span-full py-12 text-center border border-dashed border-border rounded-2xl bg-secondary/20">
                <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No roadmaps yet</h3>
                <p className="text-muted-foreground mb-6">Generate a learning roadmap from an ATS scan.</p>
                <Link href="/roadmap" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Create Roadmap
                </Link>
              </div>
            ) : (
              roadmaps.map((roadmap) => {
                // Determine weeks count if roadmap_data is an array
                const weeksCount = Array.isArray(roadmap.roadmap_data) ? roadmap.roadmap_data.length : 0;
                
                return (
                  <div key={roadmap.id} className="bg-white rounded-2xl border border-border shadow-sm p-6 hover:border-primary/50 transition-colors group cursor-pointer flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <Map className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-lg">{roadmap.target_role}</h3>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(roadmap.created_at)}</span>
                          {weeksCount > 0 && (
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {weeksCount}-Week Plan</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between mt-auto">
                      <span className="text-sm font-medium text-primary">View Learning Plan</span>
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
