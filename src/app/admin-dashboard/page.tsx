"use client";

import Image from "next/image";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { useState, useEffect, type FormEvent, type ComponentType } from "react";
import dynamic from "next/dynamic";
import {
  authenticateAdmin,
  saveAdminSession,
  clearAdminSession,
  loadAdminSession,
  type SafeAdmin,
} from "./_lib/admins";

type AdminDashboardProps = {
  admin: SafeAdmin;
  onLogout: () => void;
};

const AdminDashboard = dynamic(() => import("./components/AdminDashboard"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center relative">
      <GradientBackground />
      <p className="text-sm text-slate-500 relative z-10">Loading dashboard…</p>
    </div>
  ),
}) as ComponentType<AdminDashboardProps>;

export default function AdminDashboardPage() {
  const [auth, setAuth] = useState<"checking" | "login" | "ok">("checking");
  const [admin, setAdmin] = useState<SafeAdmin | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const session = loadAdminSession();
    if (session) {
      setAdmin(session);
      setAuth("ok");
    } else {
      setAuth("login");
    }
  }, []);

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    const user = authenticateAdmin(username, password);
    if (user) {
      saveAdminSession(user);
      setAdmin(user);
      setError("");
      setAuth("ok");
    } else {
      setError("Invalid username or password.");
      setPassword("");
    }
  }

  function handleLogout() {
    clearAdminSession();
    setAdmin(null);
    setAuth("login");
    setUsername("");
    setPassword("");
  }

  if (auth === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <GradientBackground />
        <p className="text-sm text-slate-500 relative z-10">Loading…</p>
      </div>
    );
  }

  if (auth === "login") {
    return (
      <div className="min-h-screen flex flex-col relative">
        <GradientBackground />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md">
                <Image
                  src="/baazar-logo.svg"
                  alt="Baazar Kolkata"
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <div className="text-center">
                <h1 className="text-lg font-bold text-slate-900">
                  Admin Login
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Baazar Retail Private Limited
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-user"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Username
                </label>
                <input
                  id="admin-user"
                  type="text"
                  placeholder="Admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  autoComplete="username"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label
                  htmlFor="admin-pass"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-pass"
                    type={showPw ? "text" : "password"}
                    placeholder="Admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-12 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    tabIndex={-1}
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
                {error && (
                  <p className="mt-1.5 text-xs text-red-600">{error}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "#0A2540" }}
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard admin={admin!} onLogout={handleLogout} />;
}
