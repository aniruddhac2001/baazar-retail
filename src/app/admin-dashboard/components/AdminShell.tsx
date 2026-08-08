"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/components/ui/Navbar";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-[#F0F4F8]">{children}</div>
    </>
  );
}
