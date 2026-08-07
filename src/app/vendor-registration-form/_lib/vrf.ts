import { supabase } from "@/lib/supabase/client";

/**
 * Current local date as dd-mm-yyyy.
 * Updates automatically when the calendar day changes.
 */
export function formatVrfDate(date: Date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

/** 1 → "001", 2 → "002", … */
export function formatVrfSeq(n: number): string {
  const num = Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  return String(num).padStart(3, "0");
}

export function buildVrfNumber(datePart: string, seq: number): string {
  return `VRF / ${datePart} / ${formatVrfSeq(seq)}`;
}

const LOCAL_SEQ_KEY = "vrf_global_seq";

/**
 * Global running sequence — does NOT reset on a new day.
 * 001 → 002 → 003 across all dates.
 *
 * After insert: total vendor count (includes the new row).
 * Fallback: localStorage global counter.
 */
async function getGlobalSequence(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("vendors")
      .select("*", { count: "exact", head: true });

    if (!error && typeof count === "number" && count >= 1) {
      return count;
    }
  } catch {
    /* fall through */
  }

  return nextLocalGlobalSeq();
}

function nextLocalGlobalSeq(): number {
  if (typeof window === "undefined") return 1;
  const current = parseInt(localStorage.getItem(LOCAL_SEQ_KEY) || "0", 10) || 0;
  const next = current + 1;
  localStorage.setItem(LOCAL_SEQ_KEY, String(next));
  return next;
}

/**
 * VRF / dd-mm-yyyy / NNN
 *
 * - Date = today (changes automatically on a new day)
 * - Sequence = continuous 001, 002, 003… (never resets)
 *
 * Example:
 *   VRF / 05-08-2026 / 001
 *   VRF / 05-08-2026 / 002
 *   VRF / 06-08-2026 / 003   ← next day, sequence continues
 */
export async function generateVrfNumber(): Promise<string> {
  const datePart = formatVrfDate();
  const seq = await getGlobalSequence();

  if (typeof window !== "undefined") {
    const stored = parseInt(localStorage.getItem(LOCAL_SEQ_KEY) || "0", 10) || 0;
    if (seq > stored) localStorage.setItem(LOCAL_SEQ_KEY, String(seq));
  }

  return buildVrfNumber(datePart, seq);
}
