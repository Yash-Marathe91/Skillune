"use client";

import { useState, useEffect } from "react";
import { User, Briefcase, Code, Link as LinkIcon, Globe, ExternalLink, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  full_name: string;
  bio: string;
  current_job: string;
  target_role: string;
  skills: string[];
  linkedin_url: string;
  github_url: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const res = await fetch("http://localhost:8000/api/v1/profile", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) throw new Error("Failed to fetch profile");
      
      const data = await res.json();
      setProfile({
        id: data.id || "",
        full_name: data.full_name || "",
        bio: data.bio || "",
        current_job: data.current_job || "",
        target_role: data.target_role || "",
        skills: data.skills || [],
        linkedin_url: data.linkedin_url || "",
        github_url: data.github_url || ""
      });
      setSkillsInput(data.skills ? data.skills.join(", ") : "");
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load profile data.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const skillsArray = skillsInput
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const res = await fetch("http://localhost:8000/api/v1/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          bio: profile.bio,
          current_job: profile.current_job,
          target_role: profile.target_role,
          skills: skillsArray,
          linkedin_url: profile.linkedin_url,
          github_url: profile.github_url
        })
      });
      
      if (!res.ok) throw new Error("Failed to update profile");
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setProfile({ ...profile, skills: skillsArray });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Your Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information, career goals, and professional links. This information helps us tailor your mock interviews and career roadmaps.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-500/10 text-green-700 border border-green-500/20' : 'bg-red-500/10 text-red-700 border border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Personal Information</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Full Name</label>
              <input 
                type="text" 
                name="full_name"
                value={profile?.full_name || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Bio (Short Summary)</label>
              <textarea 
                name="bio"
                value={profile?.bio || ""}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30 resize-none"
                placeholder="A passionate software engineer with 3 years of experience..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Briefcase className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Career Goals</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Current Role</label>
              <input 
                type="text" 
                name="current_job"
                value={profile?.current_job || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30"
                placeholder="e.g., Junior Developer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Target Role</label>
              <input 
                type="text" 
                name="target_role"
                value={profile?.target_role || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30"
                placeholder="e.g., Senior Full Stack Engineer"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-foreground block flex items-center gap-2">
                <Code className="w-4 h-4 text-muted-foreground" />
                Key Skills (Comma separated)
              </label>
              <input 
                type="text" 
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30"
                placeholder="React, Python, AWS, Node.js"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <LinkIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Professional Links</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#0077b5]" />
                LinkedIn URL
              </label>
              <input 
                type="url" 
                name="linkedin_url"
                value={profile?.linkedin_url || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30"
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-foreground" />
                GitHub URL
              </label>
              <input 
                type="url" 
                name="github_url"
                value={profile?.github_url || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30"
                placeholder="https://github.com/johndoe"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={isSaving}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
