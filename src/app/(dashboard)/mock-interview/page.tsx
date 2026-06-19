"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Briefcase, Settings2, Play, CheckCircle, AlertTriangle, Mic, MicOff, Volume2, VolumeX, Camera, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

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
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationData, setEvaluationData] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Camera access is required for Computer Vision interviews.");
      setIsVideoMode(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isVideoMode && isStarted) {
      startCamera();
      // Force voice mode on for realistic feeling in video
      setIsVoiceMode(true);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isVideoMode, isStarted]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue((prev) => prev ? prev + " " + transcript : transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Speech recognition is not supported in your browser. Please use Google Chrome.");
      }
    }
  };

  const speakText = (text: string) => {
    if (!isVoiceMode) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.includes("en-US") && v.name.includes("Female")) || voices.find(v => v.lang.includes("en-US")) || voices[0];
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    }
  };

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
      if (isVoiceMode) speakText(data.message);
    } catch (err) {
      console.error(err);
      setMessages([{ role: "assistant", content: "Error starting interview. Please check your backend connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current && isVideoMode) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        return canvasRef.current.toDataURL('image/jpeg', 0.8);
      }
    }
    return null;
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
      
      let latestFrame = null;
      if (isVideoMode) {
        latestFrame = captureFrame();
      }
      
      const endpoint = isVideoMode ? "chat_vision" : "chat";
      
      const res = await fetch(`http://localhost:8000/api/v1/interview/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          job_role: jobRole,
          history: newMessages,
          ...(isVideoMode && latestFrame ? { latest_frame_base64: latestFrame } : {})
        })
      });
      
      if (!res.ok) throw new Error("Failed to send message");
      
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.message }]);
      if (isVoiceMode) speakText(data.message);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: "assistant", content: "Network error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const endInterview = async () => {
    if (isListening) toggleListening();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    if (messages.length < 2) {
      setIsStarted(false);
      return;
    }
    
    setIsEvaluating(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch("http://localhost:8000/api/v1/interview/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          job_role: jobRole,
          interview_type: interviewType,
          history: messages
        })
      });
      
      if (!res.ok) throw new Error("Failed to evaluate");
      
      const data = await res.json();
      setEvaluationData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Interview Mode</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setIsVideoMode(false)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col items-center gap-2 ${!isVideoMode ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
                  >
                    <MessageSquare className="w-6 h-6 text-primary" />
                    <span className="font-semibold text-sm">Text & Audio</span>
                  </div>
                  <div 
                    onClick={() => setIsVideoMode(true)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col items-center gap-2 ${isVideoMode ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
                  >
                    <Camera className="w-6 h-6 text-primary" />
                    <span className="font-semibold text-sm">Live Video</span>
                  </div>
                </div>
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
      ) : evaluationData || isEvaluating ? (
        <div className="flex-1 bg-white rounded-xl border border-border shadow-sm flex flex-col p-8 overflow-y-auto">
          {isEvaluating ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <h2 className="text-xl font-bold text-foreground">Evaluating Interview...</h2>
              <p className="text-muted-foreground text-center max-w-md">The AI is reviewing your answers and preparing your comprehensive performance report.</p>
            </div>
          ) : (
            <div className="space-y-8 max-w-3xl mx-auto w-full">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-4 border-primary/20 mb-2">
                  <span className="text-3xl font-bold text-primary">{evaluationData.score}</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground">Interview Complete</h2>
                <p className="text-muted-foreground">Here is how you performed for the {jobRole} role.</p>
              </div>

              <div className="bg-secondary/50 rounded-xl p-6 border border-border">
                <h3 className="font-bold text-foreground flex items-center gap-2 mb-3">
                  <Bot className="w-5 h-5 text-primary" /> Overall Feedback
                </h3>
                <p className="text-sm text-secondary-foreground leading-relaxed">
                  {evaluationData.feedback}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-success flex items-center gap-2 border-b border-border pb-2">
                    <CheckCircle className="w-5 h-5" /> Strengths
                  </h3>
                  <ul className="space-y-2">
                    {evaluationData.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0"></span>
                        <span className="text-muted-foreground">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-destructive flex items-center gap-2 border-b border-border pb-2">
                    <CheckCircle className="w-5 h-5" /> Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {evaluationData.weaknesses.map((w: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0"></span>
                        <span className="text-muted-foreground">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-secondary/30 rounded-xl p-6 border border-border">
                  <h3 className="font-bold text-foreground mb-4 text-center">Skill Breakdown</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                        { subject: 'Overall', A: evaluationData.score, fullMark: 100 },
                        { subject: 'Technical', A: evaluationData.technical_score, fullMark: 100 },
                        { subject: 'Communication', A: evaluationData.communication_score, fullMark: 100 },
                        { subject: 'Behavioral', A: evaluationData.behavioral_score, fullMark: 100 },
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-warning flex items-center gap-2 border-b border-border pb-2 text-yellow-600">
                    <AlertTriangle className="w-5 h-5" /> Language & Grammar
                  </h3>
                  
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                    {evaluationData.grammatical_errors?.length > 0 || evaluationData.sentence_errors?.length > 0 ? (
                      <>
                        {evaluationData.grammatical_errors?.map((err: string, i: number) => (
                          <div key={`g-${i}`} className="text-sm bg-yellow-50/50 p-3 rounded-md border border-yellow-100">
                            <span className="font-semibold text-yellow-700 block mb-1">Grammar Error:</span>
                            <span className="text-muted-foreground">{err}</span>
                          </div>
                        ))}
                        {evaluationData.sentence_errors?.map((err: string, i: number) => (
                          <div key={`s-${i}`} className="text-sm bg-yellow-50/50 p-3 rounded-md border border-yellow-100">
                            <span className="font-semibold text-yellow-700 block mb-1">Sentence Structure:</span>
                            <span className="text-muted-foreground">{err}</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="bg-success/10 border border-success/20 p-4 rounded-md">
                        <p className="text-sm text-success font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> No major grammatical or sentence errors detected. Great job!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-8 flex justify-center">
                <button 
                  onClick={() => {
                    setIsStarted(false);
                    setEvaluationData(null);
                    setMessages([]);
                  }}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Start New Interview
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`flex-1 flex gap-4 overflow-hidden ${isVideoMode ? "flex-col lg:flex-row" : "flex-col"}`}>
          {isVideoMode && (
            <div className="lg:w-1/3 bg-black rounded-xl border border-border shadow-sm overflow-hidden relative flex shrink-0">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
                 <span className="text-white text-xs font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>Live Feed</span>
                 <Camera className="w-4 h-4 text-white/70" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          <div className="flex-1 bg-white rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
            {/* Chat Header */}
          <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center relative">
                <Bot className="w-5 h-5 text-primary" />
                {isVoiceMode && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                  AI Interviewer 
                </p>
                <p className="text-xs text-muted-foreground">{interviewType} • {jobRole}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsVoiceMode(!isVoiceMode);
                  if (isVoiceMode && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className={`p-2 rounded-md transition-colors ${isVoiceMode ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-muted-foreground hover:bg-secondary'}`}
                title={isVoiceMode ? "Disable Voice Responses" : "Enable Voice Responses"}
              >
                {isVoiceMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <div className="w-[1px] h-6 bg-border mx-1"></div>
              <button 
                onClick={endInterview}
                disabled={isLoading}
                className="text-sm text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
              >
                End Interview
              </button>
            </div>
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
            <div className="relative flex items-center gap-2">
              <button
                onClick={toggleListening}
                className={`p-3 rounded-xl transition-colors border shadow-sm ${
                  isListening 
                    ? "bg-red-500 hover:bg-red-600 text-white border-red-600 animate-pulse" 
                    : "bg-white hover:bg-secondary text-foreground border-border"
                }`}
                title={isListening ? "Stop Recording" : "Start Voice Input"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <div className="relative flex-1">
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
                  placeholder={isListening ? "Listening..." : "Type your response here... (Press Enter to send)"}
                  className="w-full pl-4 pr-14 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-[52px] min-h-[52px] max-h-32 bg-secondary/20"
                  rows={1}
                />
                <button 
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 top-2 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-2">
              {isListening && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
              Tip: Answer fully and honestly. Use the microphone for realistic voice practice.
            </p>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
