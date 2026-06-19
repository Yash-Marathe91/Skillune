"use client";

import { useState } from "react";
import { Briefcase, Target, Loader2, BookOpen, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PrepQuestion {
  question: string;
  category: string;
  ideal_answer_framework: string;
}

interface PrepData {
  questions: PrepQuestion[];
  tips: string[];
}

export default function InterviewPrepPage() {
  const [jobRole, setJobRole] = useState("");
  const [difficulty, setDifficulty] = useState("Mid");
  const [domain, setDomain] = useState("Software Engineering");
  const [language, setLanguage] = useState("");
  const [frameworks, setFrameworks] = useState("");
  const [focusCategory, setFocusCategory] = useState("Balanced (Tech & Behavioral)");
  
  const [isLoading, setIsLoading] = useState(false);
  const [prepData, setPrepData] = useState<PrepData | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const generatePrepGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobRole.trim()) return;

    setIsLoading(true);
    setPrepData(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch("http://localhost:8000/api/v1/interview/prep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          job_role: jobRole,
          difficulty: difficulty,
          domain: domain,
          language: language,
          frameworks: frameworks,
          focus_category: focusCategory
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate preparation guide");
      }

      const data = await response.json();
      setPrepData(data.data);
      setExpandedIndex(0); // Open the first question by default
    } catch (error: any) {
      console.error(error);
      alert(error.message || "An error occurred while generating the guide. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
          <Briefcase className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Interview Preparation</h1>
          <p className="text-muted-foreground mt-1">
            Generate customized interview questions and answer frameworks for any role.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <form onSubmit={generatePrepGuide} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="jobRole" className="text-sm font-medium text-foreground block flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Target Job Role
                </label>
                <input
                  id="jobRole"
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g., Senior React Developer"
                  className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="domain" className="text-sm font-medium text-foreground block">
                  Industry / Domain
                </label>
                <input
                  id="domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g., Finance, E-commerce, Healthcare"
                  className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="language" className="text-sm font-medium text-foreground block">
                  Primary Language (Optional)
                </label>
                <input
                  id="language"
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g., Python, JavaScript, Go"
                  className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="frameworks" className="text-sm font-medium text-foreground block">
                  Frameworks / Tools (Optional)
                </label>
                <input
                  id="frameworks"
                  type="text"
                  value={frameworks}
                  onChange={(e) => setFrameworks(e.target.value)}
                  placeholder="e.g., React, AWS, Docker"
                  className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="difficulty" className="text-sm font-medium text-foreground block">
                  Experience Level
                </label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30"
                >
                  <option value="Internship">Internship</option>
                  <option value="Junior">Junior / Entry-Level</option>
                  <option value="Mid">Mid-Level</option>
                  <option value="Senior">Senior / Lead</option>
                  <option value="Executive">Executive / Director</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="focusCategory" className="text-sm font-medium text-foreground block">
                  Interview Focus
                </label>
                <select
                  id="focusCategory"
                  value={focusCategory}
                  onChange={(e) => setFocusCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30"
                >
                  <option value="Balanced (Tech & Behavioral)">Balanced (Tech & Behavioral)</option>
                  <option value="Highly Technical / Coding">Highly Technical / Coding</option>
                  <option value="System Design & Architecture">System Design & Architecture</option>
                  <option value="Behavioral & Culture Fit">Behavioral & Culture Fit</option>
                  <option value="Leadership & Management">Leadership & Management</option>
                </select>
              </div>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !jobRole.trim()}
                className="w-full md:w-auto px-8 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mx-auto"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Generate Custom Prep Guide"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground">Generating Your Study Guide...</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">Our AI is analyzing the requirements for a {difficulty} {jobRole} and preparing tailored questions.</p>
          </div>
        </div>
      )}

      {prepData && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Main Content: Questions */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Practice Questions & Frameworks
            </h2>
            
            <div className="space-y-4">
              {prepData.questions.map((q, idx) => (
                <div key={idx} className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm transition-all">
                  <button 
                    onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                    className="w-full text-left p-6 flex items-start justify-between gap-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div>
                      <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-md mb-3">
                        {q.category}
                      </span>
                      <h3 className="font-bold text-lg text-foreground pr-4 leading-tight">{q.question}</h3>
                    </div>
                    <div className="mt-1 shrink-0 p-1.5 bg-secondary rounded-full text-muted-foreground">
                      {expandedIndex === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  
                  {expandedIndex === idx && (
                    <div className="px-6 pb-6 pt-2 border-t border-border bg-secondary/10">
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        Ideal Answer Framework (STAR Method)
                      </h4>
                      <div className="text-sm text-muted-foreground leading-relaxed p-4 bg-white border border-border rounded-xl">
                        {q.ideal_answer_framework}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Sidebar: Tips */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Top Pro-Tips
            </h2>
            
            <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
              <ul className="space-y-5">
                {prepData.tips.map((tip, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-md mt-6">
              <h3 className="font-bold mb-2">Ready to practice?</h3>
              <p className="text-sm text-primary-foreground/80 mb-4">
                Put these frameworks to the test in a live mock interview environment.
              </p>
              <a 
                href="/mock-interview" 
                className="block w-full py-2.5 px-4 bg-white text-primary text-center text-sm font-bold rounded-xl hover:bg-secondary transition-colors"
              >
                Start Mock Interview
              </a>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
