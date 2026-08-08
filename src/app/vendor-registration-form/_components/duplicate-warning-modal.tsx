"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, CopyIcon, CheckIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Vendor } from "@/lib/supabase/types";
import { statusLabel } from "@/app/admin-dashboard/_lib/admins";

type Props = {
  open: boolean;
  onClose: () => void;
  existingVendor: Vendor | null;
};

export function DuplicateWarningModal({
  open,
  onClose,
  existingVendor,
}: Props) {
  const [copied, setCopied] = useState(false);

  if (!existingVendor) return null;

  const vrfNumber = existingVendor.vrfNumber || existingVendor.id;

  const handleCopy = async () => {
    if (!vrfNumber) return;
    try {
      await navigator.clipboard.writeText(vrfNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md text-center p-0 overflow-hidden">
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(90deg, #F59E0B, #EF4444)" }}
        />

        <div className="flex flex-col items-center gap-5 px-8 py-8">
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 16,
              delay: 0.05,
            }}
            className="relative"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "rgba(245, 158, 11, 0.15)" }}
            >
              <AlertTriangleIcon
                className="w-10 h-10"
                style={{ color: "#D97706" }}
              />
            </div>
          </motion.div>

          <motion.div
            className="space-y-3 w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.2 }}
          >
            <h2 className="text-xl font-bold" style={{ color: "#0A2540" }}>
              Application Already Submitted!
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
              A vendor registration with this{" "}
              <span className="font-semibold">Email</span>,{" "}
              <span className="font-semibold">PAN</span>, or{" "}
              <span className="font-semibold">GSTIN</span> has already been
              submitted to{" "}
              <span className="font-semibold">
                Baazar Retail Private Limited
              </span>
              .
            </p>

            {/* Original VRF Details Card */}
            <div className="mx-auto mt-3 max-w-sm space-y-2 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-left shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                Original Application Details
              </p>

              <div className="flex items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
                <span className="text-xs text-slate-600 font-medium">
                  Vendor Unique ID:
                </span>
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-amber-300">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {vrfNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-slate-500 hover:text-amber-700 transition p-0.5"
                    title="Copy VRF ID"
                  >
                    {copied ? (
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <CopyIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {existingVendor.name && (
                <div className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-slate-600 font-medium">
                    Entity Name:
                  </span>
                  <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                    {existingVendor.name}
                  </span>
                </div>
              )}

              {existingVendor.created_at && (
                <div className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-slate-600 font-medium">
                    Submitted On:
                  </span>
                  <span className="text-slate-800">
                    {new Date(existingVendor.created_at).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600 font-medium">
                  Current Status:
                </span>
                <span className="font-semibold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-full text-[11px]">
                  {statusLabel(existingVendor.status || undefined)}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.3 }}
          >
            <Button
              onClick={onClose}
              className="w-full font-semibold py-2.5 bg-slate-900 hover:bg-slate-800 text-white"
            >
              Understood / Close
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
