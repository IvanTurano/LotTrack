import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

interface ProtectedRouteProps {
  children: (user: User) => ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#171717]">
        <div className="w-6 h-6 border-2 border-[#3ecf8e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    // No Supabase configured — allow access without auth
    return <>{children(null as unknown as User)}</>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children(user)}</>;
}
