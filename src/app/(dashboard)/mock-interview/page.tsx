"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Briefcase, Settings2, Play, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export default function MockInterview() {
  const [jobRole, setJobRole] = useState("Software Engineer");
  const [interviewType, setInterviewType] = useState("Technical");
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const startInterview = async () => {
    setIsStarted(true);
    setIsLoading(true);
    
    // Initial prompt to backend to start the interview
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch("http://localhost:8000/api/v1/interview/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          job_role: jobRole,
          interview_type: interviewType
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Backend Error:", errorText);
        throw new Error(`Failed to start interview: ${res.status} - ${errorText}`);
      }
      
      const data = await res.json();
      setMessages([
        { role: "assistant", content: data.message }
      ]);
    } catch (err) {
      console.error(err);
      setMessages([{ role: "assistant", content: "Error starting interview. Please check your backend connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const newMessages = [...messages, { role: "user", content: inputValue } as Message];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch("http://localhost:8000/api/v1/interview/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          job_role: jobRole,
          history: newMessages
        })
      });
      
      if (!res.ok) throw new Error("Failed to send message");
      
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.message }]);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: "assistant", content: "Network error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">AI Mock Interview</h1>
        {isStarted && (
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Interview in progress
          </span>
        )}
      </div>

      {!isStarted ? (
        <div className="flex-1 bg-white rounded-xl border border-border shadow-sm flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Customize Your Interview</h2>
              <p className="text-muted-foreground">Select your target role and interview type to begin.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Target Role</label>
                <input 
                  type="text" 
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Frontend Developer, Data Scientist..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Interview Type</label>
                <select 
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
                >
                  <option>Behavioral & Cultural</option>
                  <option>Technical & Core Skills</option>
                  <option>System Design</option>
                  <option>Leadership & Management</option>
                </select>
              </div>

              <button 
                onClick={startInterview}
                className="w-full bg-primary text-primary-foreground py-3 rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm"
              >
                <Play className="w-4 h-4" /> Start Interview
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">AI Interviewer</p>
                <p className="text-xs text-muted-foreground">{interviewType} • {jobRole}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsStarted(false)}
              className="text-sm text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors"
            >
              End Interview
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex justify-center">
              <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full border border-border">
                Interview Started
              </span>
            </div>
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-foreground"}`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-2xl ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-secondary border border-border text-foreground rounded-tl-sm"}`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-secondary border border-border text-foreground flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary border border-border rounded-tl-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-border bg-white">
            <div className="relative flex items-center">
              <textarea 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={isLoading}
                placeholder="Type your response here... (Press Enter to send)"
                className="w-full pl-4 pr-14 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-[52px] min-h-[52px] max-h-32 bg-secondary/20"
                rows={1}
              />
              <button 
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              Tip: Answer fully and honestly. The AI will evaluate your response before asking the next question.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
