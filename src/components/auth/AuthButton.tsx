"use client";

import { createClient } from "@/lib/supabase/client";
import { LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  if (loading) {
    return <div className="h-10 w-24 bg-secondary animate-pulse rounded-md"></div>;
  }

  if (user) {
    return (
      <Link href="/dashboard" className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
        Go to Dashboard
      </Link>
    );
  }

  return (
    <button 
      onClick={handleLogin}
      className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
    >
      <LogIn className="w-4 h-4" />
      Sign in with GitHub
    </button>
  );
}
