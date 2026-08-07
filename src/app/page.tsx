"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { UserRound, ShieldCheck } from "lucide-react";
import { GradientBackground } from "@/components/ui/GradientBackground";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <GradientBackground />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg mb-4">
            <Image
              src="/baazar-logo.svg"
              alt="Baazar Kolkata"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <p className="mt-1.5 text-sm text-slate-500 text-center">
            Partnering for Scale, Growing Together
          </p>
        </div>

        <div className="rounded-3xl bg-white/90 backdrop-blur-sm p-6 sm:p-8 shadow-xl border border-slate-100 space-y-4">
          <Link
            href="/vendor-registration-form"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 no-underline transition-all hover:border-orange-300 hover:bg-orange-50/60 hover:shadow-md"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{ background: "#FF6B00" }}
            >
              <UserRound className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-slate-900">Vendor</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Register as a vendor — complete the application form
              </p>
            </div>
            <span className="text-slate-300 group-hover:text-orange-400 text-lg font-light">
              →
            </span>
          </Link>

          <Link
            href="/admin-dashboard"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 no-underline transition-all hover:border-indigo-300 hover:bg-indigo-50/60 hover:shadow-md"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{ background: "#0A2540" }}
            >
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-slate-900">Admin</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Sign in to the internal admin portal
              </p>
            </div>
            <span className="text-slate-300 group-hover:text-indigo-500 text-lg font-light">
              →
            </span>
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Powered by Baazar Retail Private Limited
        </p>
      </motion.div>
    </main>
  );
}