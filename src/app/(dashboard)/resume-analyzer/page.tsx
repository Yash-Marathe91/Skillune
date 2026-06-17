"use client";

import { useState } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a resume first.");
      return;
    }
    if (!jobDescription) {
      setError("Please paste the job description.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job_description", jobDescription);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch("http://localhost:8000/api/v1/resume/analyze", {
        method: "POST",
        headers: {
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to analyze resume.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Resume Analyzer</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Upload */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold text-foreground mb-4">Upload Resume</h2>
          
          <div className="flex-1 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-8 bg-secondary/20 hover:bg-secondary/40 transition-colors relative">
            <input 
              type="file" 
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud className="w-12 h-12 text-primary mb-4" />
            <p className="text-sm font-medium text-foreground">Drag and drop or click to upload</p>
            <p className="text-xs text-muted-foreground mt-2">Supported formats: PDF, DOCX (Max 5MB)</p>
          </div>

          {file && (
            <div className="mt-4 p-4 rounded-md bg-secondary flex items-center gap-3 border border-border">
              <FileText className="w-8 h-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive">
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Job Description & Action */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold text-foreground mb-4">Job Description</h2>
          
          <textarea 
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            className="flex-1 w-full p-4 rounded-md border border-border bg-secondary/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          ></textarea>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="mt-4 w-full bg-primary text-primary-foreground py-3 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? "Analyzing Resume..." : "Analyze Match"}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm mt-6">
          <div className="flex items-center gap-4 border-b border-border pb-4 mb-4">
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center border-4 border-success">
              <span className="font-bold text-lg text-foreground">{result.ats_score}%</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Analysis Complete</h2>
              <p className="text-sm text-muted-foreground">Here is how your resume matches the job description.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" /> Matching Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.matching_skills.map((s: string) => (
                  <span key={s} className="px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-full">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" /> Missing Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missing_skills.map((s: string) => (
                  <span key={s} className="px-3 py-1 bg-destructive/10 text-destructive text-xs font-medium rounded-full">{s}</span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-secondary rounded-md border border-border">
            <h3 className="font-semibold text-sm mb-2">AI Summary</h3>
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
