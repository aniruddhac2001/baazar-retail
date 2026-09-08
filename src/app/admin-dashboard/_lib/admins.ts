/** Four admin accounts for Baazar Retail HO — editable by super admin */

export type AdminRole = "super" | "accounts" | "gst" | "it";

export type AdminUser = {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: AdminRole;
  queue: string[];
  approveTo: string | null;
  canCrud: boolean;
};

export type SafeAdmin = Omit<AdminUser, "password">;

/** Factory defaults (used on first load / reset) */
export const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: "1",
    username: "baazarretail",
    password: "BR@ADMIN",
    displayName: "Admin",
    role: "super",
    queue: [
      "pending",
      "accounts_approved",
      "gst_approved",
      "approved",
      "rejected",
    ],
    approveTo: "approved",
    canCrud: true,
  },
  {
    id: "2",
    username: "bk@account",
    password: "ADMIN@AC",
    displayName: "Accounts",
    role: "accounts",
    queue: ["pending"],
    approveTo: "accounts_approved",
    canCrud: false,
  },
  {
    id: "3",
    username: "bk@gst",
    password: "ADMIN@GST",
    displayName: "GST",
    role: "gst",
    queue: ["accounts_approved"],
    approveTo: "gst_approved",
    canCrud: false,
  },
  {
    id: "4",
    username: "bk@it",
    password: "ADMIN@IT",
    displayName: "IT",
    role: "it",
    queue: ["gst_approved"],
    approveTo: "approved",
    canCrud: false,
  },
];

const USERS_KEY = "baazar_admin_users";
const SESSION_KEY = "admin_auth";
const SESSION_USER_KEY = "admin_user";

/** Deep-merge stored users with defaults so role/queue/canCrud stay correct */
function mergeWithDefaults(stored: AdminUser[]): AdminUser[] {
  return DEFAULT_ADMIN_USERS.map((def) => {
    const s = stored.find((u) => u.id === def.id);
    if (!s) return { ...def };
    return {
      ...def,
      username: s.username || def.username,
      password: s.password || def.password,
      displayName: s.displayName || def.displayName,
    };
  });
}

export function getAdminUsers(): AdminUser[] {
  if (typeof window === "undefined")
    return DEFAULT_ADMIN_USERS.map((u) => ({ ...u }));
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return DEFAULT_ADMIN_USERS.map((u) => ({ ...u }));
    const parsed = JSON.parse(raw) as AdminUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_ADMIN_USERS.map((u) => ({ ...u }));
    }
    return mergeWithDefaults(parsed);
  } catch {
    return DEFAULT_ADMIN_USERS.map((u) => ({ ...u }));
  }
}

export function saveAdminUsers(users: AdminUser[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

/**
 * Super admin updates username / password / displayName for any user.
 * Role, queue, canCrud cannot be changed (locked to defaults).
 */
export function updateAdminUserDetails(
  id: string,
  updates: { username?: string; password?: string; displayName?: string },
): AdminUser[] {
  const users = getAdminUsers();
  const next = users.map((u) => {
    if (u.id !== id) return u;
    return {
      ...u,
      username: updates.username?.trim() || u.username,
      password: updates.password?.trim() || u.password,
      displayName: updates.displayName?.trim() || u.displayName,
    };
  });
  saveAdminUsers(next);
  return next;
}

export function resetAdminUsersToDefault(): AdminUser[] {
  const defaults = DEFAULT_ADMIN_USERS.map((u) => ({ ...u }));
  saveAdminUsers(defaults);
  return defaults;
}

export function authenticateAdmin(
  username: string,
  password: string,
): SafeAdmin | null {
  const u = username.trim();
  const found = getAdminUsers().find(
    (a) => a.username === u && a.password === password,
  );
  if (!found) return null;
  const { password: _pw, ...safe } = found;
  return safe;
}

export function saveAdminSession(admin: SafeAdmin) {
  sessionStorage.setItem(SESSION_KEY, "1");
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(admin));
}

export function clearAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
}

export function loadAdminSession(): SafeAdmin | null {
  try {
    if (sessionStorage.getItem(SESSION_KEY) !== "1") return null;
    const raw = sessionStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SafeAdmin;
  } catch {
    return null;
  }
}

export function statusLabel(status?: string): string {
  switch (status) {
    case "pending":
      return "Pending (Accounts)";
    case "accounts_approved":
      return "Pending (GST)";
    case "gst_approved":
      return "Pending (IT)";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status || "Pending";
  }
}

export function roleLabel(role: AdminRole): string {
  switch (role) {
    case "super":
      return "Super Admin";
    case "accounts":
      return "Accounts";
    case "gst":
      return "GST";
    case "it":
      return "IT";
    default:
      return role;
  }
}

import {
  getAdminActivitiesFromDb,
  logAdminActivityToDb,
  clearAdminActivitiesFromDb,
  type DbAdminActivity,
} from "@/lib/supabase/db";
import type { Vendor } from "@/lib/supabase/types";

/** ---- Admin activity log (Database & Local Synced) ---- */

export type AdminActivity = {
  id: string;
  at: string; // ISO
  adminId: string;
  adminName: string;
  adminRole: AdminRole;
  action: "approved" | "rejected" | "updated_user" | string;
  vendorId?: string;
  vendorName?: string;
  vrfNumber?: string;
  detail?: string;
};

const ACTIVITY_KEY = "baazar_admin_activity";

export function getAdminActivity(): AdminActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AdminActivity[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAdminActivityLocal(items: AdminActivity[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(items.slice(0, 300)));
  } catch {
    // ignore
  }
}

/**
  Fetch activity logs from Supabase DB, merge with local cache,
  and auto-synthesize entries for rejected vendors if missing.
*/
export async function fetchAdminActivityAsync(
  vendors?: Vendor[],
): Promise<AdminActivity[]> {
  const localList = getAdminActivity();
  const dbList = await getAdminActivitiesFromDb();

  const formattedDbList: AdminActivity[] = dbList.map((item, idx) => ({
    id: item.id || `db-${idx}-${item.at || Date.now()}`,
    at: item.at || new Date().toISOString(),
    adminId: item.adminId || "1",
    adminName: item.adminName || "Admin",
    adminRole: (item.adminRole as AdminRole) || "accounts",
    action: item.action || "action",
    vendorId: item.vendorId,
    vendorName: item.vendorName,
    vrfNumber: item.vrfNumber,
    detail: item.detail,
  }));

  // Combine DB & Local list by deduplicating
  const map = new Map<string, AdminActivity>();

  // Helper key for deduping
  const getKey = (a: AdminActivity) =>
    a.id.startsWith("synth-")
      ? `${a.vendorId || a.vrfNumber}-synth`
      : a.id || `${a.vendorId}-${a.action}-${a.at}`;

  for (const item of [...formattedDbList, ...localList]) {
    const k = getKey(item);
    if (!map.has(k)) {
      map.set(k, item);
    }
  }

  const combined = Array.from(map.values());

  // Auto-synthesize rejection entries for any DB vendor with status === 'rejected'
  if (vendors && Array.isArray(vendors)) {
    vendors.forEach((v) => {
      if (v.status === "rejected") {
        const hasRej = combined.some(
          (a) =>
            a.action === "rejected" &&
            (a.vendorId === v.id ||
              (a.vrfNumber && a.vrfNumber === v.vrfNumber)),
        );
        if (!hasRej) {
          let role: AdminRole = "accounts";
          let name = "Accounts Desk";
          let adminId = "2";

          const rejRole = (v.rejectedRole || v.rejectedAtStage || "").toLowerCase();
          const rem = (v.remarks || "").toLowerCase();

          if (rejRole === "gst" || rem.includes("gst")) {
            role = "gst";
            name = v.rejectedBy || "GST Desk";
            adminId = "3";
          } else if (rejRole === "it" || rem.includes("it")) {
            role = "it";
            name = v.rejectedBy || "IT Desk";
            adminId = "4";
          } else if (rejRole === "super" || rem.includes("super")) {
            role = "super";
            name = v.rejectedBy || "Super Admin";
            adminId = "1";
          } else if (v.rejectedBy) {
            name = v.rejectedBy;
          }

          const synthItem: AdminActivity = {
            id: `synth-rej-${v.id}`,
            at: v.created_at || new Date().toISOString(),
            adminId,
            adminName: name,
            adminRole: role,
            action: "rejected",
            vendorId: v.id,
            vendorName: v.name,
            vrfNumber: v.vrfNumber || undefined,
            detail: `Rejected (${roleLabel(role)} Stage)`,
          };
          combined.unshift(synthItem);
        }
      }
    });
  }

  let finalCombined = combined;

  // Filter out activities for vendors that no longer exist in DB
  if (vendors && Array.isArray(vendors)) {
    const validVendorIds = new Set(vendors.map((v) => v.id));
    const validVrfNumbers = new Set(
      vendors.map((v) => v.vrfNumber).filter(Boolean),
    );

    finalCombined = combined.filter((item) => {
      if (item.action === "deleted" || (!item.vendorId && !item.vrfNumber))
        return true;
      const idMatch = item.vendorId && validVendorIds.has(item.vendorId);
      const vrfMatch = item.vrfNumber && validVrfNumbers.has(item.vrfNumber);
      return idMatch || vrfMatch;
    });
  }

  // Sort descending by timestamp
  finalCombined.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  saveAdminActivityLocal(finalCombined);
  return finalCombined;
}

export function logAdminActivity(
  entry: Omit<AdminActivity, "id" | "at">,
): AdminActivity[] {
  const list = getAdminActivity();
  const item: AdminActivity = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
  };

  const next = [item, ...list].slice(0, 300);
  saveAdminActivityLocal(next);

  // Async write to Supabase DB in background
  logAdminActivityToDb({
    adminId: entry.adminId,
    adminName: entry.adminName,
    adminRole: entry.adminRole,
    action: entry.action,
    vendorId: entry.vendorId,
    vendorName: entry.vendorName,
    vrfNumber: entry.vrfNumber,
    detail: entry.detail,
  }).catch(() => {
    // Silent catch
  });

  return next;
}

export async function clearAdminActivity() {
  saveAdminActivityLocal([]);
  await clearAdminActivitiesFromDb();
}
