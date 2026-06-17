import Link from "next/link";
import { ArrowRight, CheckCircle, Code, ShieldCheck, Zap } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      
      {/* Minimal Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white">
            S
          </div>
          Skillune
        </div>
        <div className="flex items-center gap-6">
          <Link href="https://github.com/Yash-Marathe91/Skillune" target="_blank" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
            <Code className="w-4 h-4" />
            GitHub
          </Link>
          <AuthButton />
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8 border border-border">
          <span className="w-2 h-2 rounded-full bg-success"></span>
          100% Free & Open Source Forever
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl leading-tight mb-8">
          The Unbiased ATS Checker. <br />
          <span className="text-primary">No Paywalls. Just Truth.</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mb-12">
          Other platforms lower your ATS score to sell you their premium resume builder. 
          Skillune is a fully open-source, community-driven AI tool that tells you the honest truth about your resume.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/login" className="flex items-center gap-2 px-8 py-4 rounded-md bg-primary text-primary-foreground text-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            Start Optimizing Now <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="https://github.com/Yash-Marathe91/Skillune" target="_blank" className="flex items-center gap-2 px-8 py-4 rounded-md bg-white border border-border text-foreground text-lg font-medium hover:bg-secondary transition-colors">
            <Code className="w-5 h-5" /> Star on GitHub
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-32 text-left">
          <div className="p-8 rounded-2xl bg-white border border-border shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">No Artificial Scoring</h3>
            <p className="text-muted-foreground leading-relaxed">
              We do not intentionally lower your score. Our open-source algorithm matches your resume to the job description with complete transparency.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-border shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">GPT-4o Powered</h3>
            <p className="text-muted-foreground leading-relaxed">
              Powered by state-of-the-art LLMs to identify missing keywords, highlight skill gaps, and provide actionable improvements instantly.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-border shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6">
              <Code className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Community Driven</h3>
            <p className="text-muted-foreground leading-relaxed">
              Built by developers, for developers. Hosted on your own Supabase instance or used directly. We never lock your career data behind a subscription.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
