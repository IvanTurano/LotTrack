import { useEffect, useRef, useState, Suspense } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { supabase, isSupabaseConfigured } from "@/utils/supabase/client";
import { SalesProvider } from "@/lib/sales-context";
import { ExpenseProvider } from "@/lib/expense-context";

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-[#3ecf8e] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function AppLayout() {
  const [userName, setUserName] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user) {
        setUserEmail(user.email);
        const meta = user.user_metadata;
        if (meta?.full_name) {
          setUserName(meta.full_name);
        } else if (meta?.nombre) {
          setUserName(`${meta.nombre} ${meta.apellido || ""}`.trim());
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/login");
      } else if (session?.user) {
        setUserEmail(session.user.email);
        const meta = session.user.user_metadata;
        if (meta?.full_name) {
          setUserName(meta.full_name);
        } else if (meta?.nombre) {
          setUserName(`${meta.nombre} ${meta.apellido || ""}`.trim());
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Scroll to top on route change
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="h-full flex flex-col sm:flex-row bg-[#171717] text-[#fafafa]">
      <Sidebar userName={userName} userEmail={userEmail} />
      <main ref={mainRef} className="flex-1 overflow-auto pb-20 sm:pb-0">
        <SalesProvider>
          <ExpenseProvider>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </ExpenseProvider>
        </SalesProvider>
      </main>
      <BottomNav />
    </div>
  );
}
