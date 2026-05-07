import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _supabase: SupabaseClient | null = null;

/**
 * Check if Supabase is properly configured (not using placeholder values).
 */
export function isSupabaseConfigured(): boolean {
  return (
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    supabaseUrl !== "tu-supabase-url-aqui" &&
    supabaseUrl.startsWith("http")
  );
}

/**
 * Get the Supabase client. Only creates it if properly configured.
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!isSupabaseConfigured()) {
      throw new Error(
        "Supabase no está configurado. Revisá las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local"
      );
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

/** Convenience alias */
export const supabase = {
  get auth() {
    return getSupabase().auth;
  },
  from: (...args: Parameters<SupabaseClient["from"]>) => getSupabase().from(...args),
};
