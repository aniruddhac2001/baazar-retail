"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import {
  supabase,
  isSupabaseConfigured,
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
  onAuthStateChange,
} from "@/lib/supabase";

type AuthContextProps = {
  user: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;

    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);

      const sub = onAuthStateChange((_event, next) => {
        setSession(next);
        setUser(next?.user ?? null);
      });
      unsub = () => {
        if (sub && "data" in sub) {
          sub.data.subscription.unsubscribe();
        }
      };
    })();

    return () => unsub?.();
  }, [configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await signInWithEmail(email, password);
    return { error: error as Error | null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await signUpWithEmail(email, password);
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    await supabaseSignOut();
    setSession(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      configured,
      signIn,
      signUp,
      signOut,
    }),
    [user, session, loading, configured, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
