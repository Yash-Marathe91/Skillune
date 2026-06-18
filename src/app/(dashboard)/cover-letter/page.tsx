"use client";

import { useState } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Copy, FileSignature } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function CoverLetter() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setError("Please upload your resume.");
      return;
    }
    if (!jobDescription) {
      setError("Please paste the job description.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job_description", jobDescription);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch("http://localhost:8000/api/v1/cover-letter/generate", {
        method: "POST",
        headers: {
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to generate cover letter.");
      }

      const data = await res.json();
      setResult(data.cover_letter);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">AI Cover Letter Generator</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Inputs */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">1. Upload Resume</h2>
            
            <div className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-6 bg-secondary/20 hover:bg-secondary/40 transition-colors relative">
              <input 
                type="file" 
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-10 h-10 text-primary mb-3" />
              <p className="text-sm font-medium text-foreground">Click or drop resume</p>
            </div>

            {file && (
              <div className="mt-4 p-3 rounded-md bg-secondary flex items-center gap-3 border border-border">
                <FileText className="w-6 h-6 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">2. Job Description</h2>
            <textarea 
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-40 p-4 rounded-md border border-border bg-secondary/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            ></textarea>
          </div>
        </div>

        {/* Right Panel: Action & Output */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Generated Cover Letter</h2>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? "Generating..." : <><FileSignature className="w-4 h-4"/> Generate Now</>}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex-1 w-full p-4 rounded-md border border-border bg-secondary/10 relative group">
            {result ? (
              <>
                <button 
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 p-2 bg-white border border-border rounded-md shadow-sm text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                  {result}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center">
                Your personalized cover letter will appear here.<br/>We use your resume's tone and experiences to craft the perfect pitch.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
