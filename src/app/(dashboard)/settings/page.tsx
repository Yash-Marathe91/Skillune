"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  LogOut, 
  Mail, 
  Key, 
  Smartphone,
  Globe,
  Volume2
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  
  // Settings States
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    interviewReminders: true,
    weeklyReports: false
  });
  
  const [preferences, setPreferences] = useState({
    language: "en-US",
    voiceGender: "female"
  });

  useEffect(() => {
    // Load preferences from localStorage on mount
    const savedPrefs = localStorage.getItem("skillune_preferences");
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (e) {}
    }
    
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
      setIsLoading(false);
    };
    
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const handlePasswordReset = async () => {
    const supabase = createClient();
    if (email) {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      alert("Password reset email sent! Please check your inbox.");
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updatePreference = (key: keyof typeof preferences, value: string) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem("skillune_preferences", JSON.stringify(newPrefs));
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences, security settings, and notifications.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 space-y-2 shrink-0">
          <button 
            onClick={() => setActiveTab("general")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${activeTab === 'general' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-secondary text-foreground'}`}
          >
            <SettingsIcon className="w-5 h-5" />
            General
          </button>
          <button 
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${activeTab === 'notifications' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-secondary text-foreground'}`}
          >
            <Bell className="w-5 h-5" />
            Notifications
          </button>
          <button 
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${activeTab === 'security' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-secondary text-foreground'}`}
          >
            <Shield className="w-5 h-5" />
            Security
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* General Tab */}
          {activeTab === "general" && (
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-border">
                <h2 className="text-xl font-bold text-foreground mb-1">Application Preferences</h2>
                <p className="text-sm text-muted-foreground">Customize how Skillune looks and feels.</p>
              </div>
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Display Language
                  </label>
                  <select 
                    value={preferences.language}
                    onChange={(e) => updatePreference('language', e.target.value)}
                    className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                    AI Interviewer Voice Preference
                  </label>
                  <select 
                    value={preferences.voiceGender}
                    onChange={(e) => updatePreference('voiceGender', e.target.value)}
                    className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-secondary/30"
                  >
                    <option value="female">Female (Default)</option>
                    <option value="male">Male</option>
                    <option value="neutral">Neutral</option>
                  </select>
                  <p className="text-xs text-muted-foreground">This setting controls the pitch and tone of the browser's speech synthesis engine.</p>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-border">
                <h2 className="text-xl font-bold text-foreground mb-1">Email Notifications</h2>
                <p className="text-sm text-muted-foreground">Choose what updates you want to receive.</p>
              </div>
              <div className="p-6 sm:p-8 space-y-6">
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-foreground">Interview Reminders</h3>
                    <p className="text-sm text-muted-foreground">Get reminded of upcoming scheduled mock interviews.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={notifications.interviewReminders} onChange={() => toggleNotification('interviewReminders')} />
                    <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-foreground">Weekly Progress Reports</h3>
                    <p className="text-sm text-muted-foreground">Receive a weekly summary of your ATS scores and interview performance.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={notifications.weeklyReports} onChange={() => toggleNotification('weeklyReports')} />
                    <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-foreground">Product Updates</h3>
                    <p className="text-sm text-muted-foreground">Hear about new features and updates to Skillune.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={notifications.emailUpdates} onChange={() => toggleNotification('emailUpdates')} />
                    <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-border">
                <h2 className="text-xl font-bold text-foreground mb-1">Security Settings</h2>
                <p className="text-sm text-muted-foreground">Manage your credentials and sessions.</p>
              </div>
              <div className="p-6 sm:p-8 space-y-8">
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Email Address</h3>
                  </div>
                  <div className="flex items-center justify-between bg-secondary/20 p-4 rounded-xl border border-border">
                    <span className="text-foreground font-medium">{email || "No email linked"}</span>
                    <span className="text-xs bg-green-500/10 text-green-700 px-2 py-1 rounded-md border border-green-500/20 font-semibold">Verified</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Password</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-secondary/20 p-4 rounded-xl border border-border">
                    <div>
                      <p className="text-sm text-foreground font-medium">Reset your password</p>
                      <p className="text-xs text-muted-foreground">We will send a secure link to your email address.</p>
                    </div>
                    <button 
                      onClick={handlePasswordReset}
                      className="px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors shrink-0"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Active Sessions</h3>
                  </div>
                  <div className="flex items-center justify-between bg-secondary/20 p-4 rounded-xl border border-border">
                    <div>
                      <p className="text-sm text-foreground font-medium">Sign out everywhere</p>
                      <p className="text-xs text-muted-foreground">Log out of all devices using this account.</p>
                    </div>
                    <button 
                      onClick={handleSignOut}
                      className="px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors shrink-0 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
