"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon, CopyIcon, CheckIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** e.g. "VRF / 05-08-2026 / 001" */
  vrfNumber?: string | null;
};

export function SuccessModal({ open, onClose, vrfNumber }: Props) {
  const [copied, setCopied] = useState(false);

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
      <DialogContent className="sm:max-w-sm text-center p-0 overflow-hidden">
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(90deg, #FF6B00, #FF9A3C)" }}
        />

        <div className="flex flex-col items-center gap-5 px-8 py-8">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
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
              style={{ background: "rgba(255,107,0,0.1)" }}
            >
              <CheckCircle2Icon
                className="w-10 h-10"
                style={{ color: "#FF6B00" }}
              />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: "2px solid rgba(255,107,0,0.3)" }}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.7, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
            />
          </motion.div>

          <motion.div
            className="space-y-3 w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.2 }}
          >
            <h2 className="text-xl font-bold" style={{ color: "#0A2540" }}>
              Application Submitted!
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Your vendor registration has been submitted to{" "}
              <span className="font-semibold text-foreground">
                Baazar Retail Private Limited
              </span>
              .
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Our team will review and get back to you shortly.
            </p>

            {/* VRF number — spaced below the review message */}
            {vrfNumber && (
              <div className="mx-auto mt-2 max-w-xs space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700/80">
                  Your unique registration ID
                </p>
                <div
                  className="flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3"
                >
                  <p
                    className="font-mono text-sm font-bold tracking-wide sm:text-base"
                    style={{ color: "#0A2540" }}
                  >
                    {vrfNumber}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 rounded-md p-1 text-slate-500 transition hover:bg-white hover:text-orange-600"
                    title="Copy VRF number"
                  >
                    {copied ? (
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <CopyIcon className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Please save this number for future reference.
                </p>
              </div>
            )}
          </motion.div>

          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.3 }}
          >
            <Button
              onClick={onClose}
              className="w-full font-semibold py-2.5 transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #FF6B00, #FF8A3C)",
                color: "white",
              }}
            >
              Submit Another Application
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
