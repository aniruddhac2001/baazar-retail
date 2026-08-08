import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://vwgylcpejojurdpukidx.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Z3lsY3Blam9qdXJkcHVraWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MjIwMjksImV4cCI6MjEwMTM5ODAyOX0.cbHYEvqAl4ZqXl6ToI51iNxzcE5LdrVY14mZOgJhqqw";

/**
 * Browser/server-safe Supabase client.
 * Prefers env vars; falls back to project defaults.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
);

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
