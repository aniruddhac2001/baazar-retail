"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

export function PreLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] as const }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: "#0A2540" }}
        >
          {/* Subtle background grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              duration: 0.55,
              ease: [0.34, 1.56, 0.64, 1] as const,
            }}
            className="relative flex flex-col items-center gap-5"
          >
            <motion.div
              className="w-28 h-28 rounded-2xl overflow-hidden shadow-2xl"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(255,107,0,0)",
                  "0 0 0 16px rgba(255,107,0,0.12)",
                  "0 0 0 0 rgba(255,107,0,0)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/baazar-logo.svg"
                alt="Baazar Kolkata"
                width={112}
                height={112}
                className="w-full h-full object-cover"
                priority
              />
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
            >
              <p className="text-white font-bold text-xl tracking-wide">
                Baazar Retail
              </p>
              <p className="text-white/50 text-xs tracking-[0.25em] uppercase mt-0.5">
                Private Limited
              </p>
            </motion.div>
          </motion.div>

          {/* Loading bar */}
          <motion.div
            className="mt-12 w-52 h-0.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.1)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #FF6B00, #FF9A3C)",
              }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 1.7,
                ease: [0.4, 0, 0.2, 1] as const,
                delay: 0.3,
              }}
            />
          </motion.div>

          {/* Loading text */}
          <motion.p
            className="mt-4 text-white/30 text-xs tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Loading…
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PreLoader;
