import { supabase } from "./client";
import {
  VENDOR_TABLE_COLUMNS,
  type Vendor,
  type VendorInsert,
  type User,
  type VendorColumn,
} from "./types";
import { getVendorDocumentUrl } from "./storage";

/**
 * Strip keys that are NOT real columns on public.vendors.
 * Prevents PGRST204 for legacy fields like category, description, state, routingNumber.
 */
export function sanitizeVendorPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const allowed = new Set<string>(VENDOR_TABLE_COLUMNS);
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(payload)) {
    if (!allowed.has(key)) continue;
    if (payload[key] === undefined) continue;
    clean[key] = payload[key];
  }
  return clean;
}

function formatSupabaseError(error: {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string;
}): string {
  const parts = [
    error.message,
    error.details ? `Details: ${error.details}` : null,
    error.hint ? `Hint: ${error.hint}` : null,
    error.code ? `Code: ${error.code}` : null,
  ].filter(Boolean);
  return parts.join(" — ") || "Database operation failed";
}

export async function getVendors(): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(formatSupabaseError(error));
  const raw = (data as Vendor[]) ?? [];
  return raw.filter(
    (v) => v.remarks !== "__DELETED__" && v.status !== "deleted",
  );
}

export async function findDuplicateVendor(params: {
  email?: string;
  panNumber?: string;
  gstin?: string;
}): Promise<Vendor | null> {
  const email = params.email?.trim().toLowerCase();
  const pan = params.panNumber?.trim().toUpperCase();
  const gstin = params.gstin?.trim().toUpperCase();

  const vendors = await getVendors();
  for (const v of vendors) {
    if (email && v.email && v.email.trim().toLowerCase() === email) {
      return v;
    }
    if (pan && v.panNumber && v.panNumber.trim().toUpperCase() === pan) {
      return v;
    }
    if (gstin && v.gstin && v.gstin.trim().toUpperCase() === gstin) {
      return v;
    }
  }
  return null;
}

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw new Error(formatSupabaseError(error));
  return (data as User[]) ?? [];
}

export async function createVendor(vendor: VendorInsert) {
  const payload = sanitizeVendorPayload(
    vendor as unknown as Record<string, unknown>,
  );

  if (!payload.name || typeof payload.name !== "string") {
    throw new Error("Vendor name is required");
  }
  if (!payload.email || typeof payload.email !== "string") {
    throw new Error("Vendor email is required");
  }

  if (payload.goodsServices != null && !Array.isArray(payload.goodsServices)) {
    payload.goodsServices = [String(payload.goodsServices)];
  }

  if (payload.status == null) {
    payload.status = "pending";
  }

  console.log("[createVendor] payload keys:", Object.keys(payload));

  const { data, error } = await supabase
    .from("vendors")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error));
  }
  return data as Vendor;
}

export async function submitVendorRegistration(payload: VendorInsert) {
  return createVendor({
    ...payload,
    status: payload.status ?? "pending",
  });
}

export const submitVendor = submitVendorRegistration;

export async function updateVendorVrf(id: string, vrfNumber: string) {
  const { data, error } = await supabase
    .from("vendors")
    .update({ vrfNumber } as Partial<Record<VendorColumn, string>>)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(formatSupabaseError(error));
  return data as Vendor;
}

export async function getVendorByVrf(vrfNumber: string) {
  const q = vrfNumber.trim();
  if (!q) return null;
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("vrfNumber", q)
    .maybeSingle();
  if (error) throw new Error(formatSupabaseError(error));
  const v = data as Vendor | null;
  if (v && (v.remarks === "__DELETED__" || v.status === "deleted")) return null;
  return v;
}

export async function searchVendors(query: string) {
  const q = query.trim();
  if (!q) return getVendors();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .or(
      `vrfNumber.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`,
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(formatSupabaseError(error));
  const raw = (data as Vendor[]) ?? [];
  return raw.filter(
    (v) => v.remarks !== "__DELETED__" && v.status !== "deleted",
  );
}

export async function deleteVendor(id: string) {
  // 1. Attempt physical SQL DELETE query first
  const { data: deletedData, error: deleteError } = await supabase
    .from("vendors")
    .delete()
    .eq("id", id)
    .select();

  if (!deleteError && deletedData && deletedData.length > 0) {
    return true;
  }

  // 2. Fallback: If physical DELETE is blocked by missing Supabase RLS DELETE policy (0 rows modified),
  // update the record in Supabase DB to mark it deleted (allowed by UPDATE policy).
  const { data: updateData, error: updateError } = await supabase
    .from("vendors")
    .update({ remarks: "__DELETED__", status: "rejected" })
    .eq("id", id)
    .select();

  if (updateError) {
    throw new Error(formatSupabaseError(updateError));
  }

  if (!updateData || updateData.length === 0) {
    throw new Error("Failed to remove vendor from Supabase database.");
  }

  return true;
}

export async function updateVendorStatus(
  id: string,
  status: "pending" | "approved" | "rejected" | string,
  adminInfo?: {
    adminName?: string;
    adminRole?: string;
    stage?: string;
  },
) {
  const updatePayload: Record<string, unknown> = { status };
  if (adminInfo) {
    if (adminInfo.adminName) updatePayload.lastActionBy = adminInfo.adminName;
    if (adminInfo.adminRole) updatePayload.lastActionRole = adminInfo.adminRole;
    if (status === "rejected") {
      if (adminInfo.adminName) updatePayload.rejectedBy = adminInfo.adminName;
      if (adminInfo.adminRole) updatePayload.rejectedRole = adminInfo.adminRole;
      if (adminInfo.stage) updatePayload.rejectedAtStage = adminInfo.stage;
    }
  }

  const cleanPayload = sanitizeVendorPayload(updatePayload);
  if (Object.keys(cleanPayload).length === 0) {
    cleanPayload.status = status;
  }

  const { data, error } = await supabase
    .from("vendors")
    .update(cleanPayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(formatSupabaseError(error));
  return data as Vendor;
}

export async function getVendorStats() {
  const vendors = await getVendors();
  return {
    total: vendors.length,
    pending: vendors.filter((v) => (v.status ?? "pending") === "pending")
      .length,
    approved: vendors.filter((v) => v.status === "approved").length,
    rejected: vendors.filter((v) => v.status === "rejected").length,
  };
}

export async function getVendorFileUrls(
  vendor: Vendor,
): Promise<Record<string, string | null>> {
  const fields = [
    "panFileId",
    "tanFileId",
    "gstFileId",
    "proofOfAddressFileId",
    "msmedFileId",
    "chequeFileId",
  ] as const;

  const urls: Record<string, string | null> = {};
  await Promise.all(
    fields.map(async (field) => {
      const storageId = vendor[field];
      if (storageId) {
        urls[field] = await getVendorDocumentUrl(storageId);
      }
    }),
  );
  return urls;
}

export async function upsertCurrentUser(profile: {
  id: string;
  email?: string;
  name?: string;
}) {
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        id: profile.id,
        email: profile.email,
        name: profile.name,
      },
      { onConflict: "id" },
    )
    .select()
    .single();
  if (error) throw new Error(formatSupabaseError(error));
  return data as User;
}

export async function getCurrentUser(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(formatSupabaseError(error));
  return data as User | null;
}

export type DbAdminActivity = {
  id?: string;
  at?: string;
  adminId: string;
  adminName: string;
  adminRole: string;
  action: string;
  vendorId?: string;
  vendorName?: string;
  vrfNumber?: string;
  detail?: string;
};

export async function getAdminActivitiesFromDb(): Promise<DbAdminActivity[]> {
  try {
    const { data, error } = await supabase
      .from("admin_activity")
      .select("*")
      .order("at", { ascending: false })
      .limit(300);

    if (error) {
      return [];
    }
    return (data as DbAdminActivity[]) ?? [];
  } catch {
    return [];
  }
}

export async function logAdminActivityToDb(
  activity: Omit<DbAdminActivity, "id" | "at">,
): Promise<DbAdminActivity | null> {
  try {
    const payload = {
      ...activity,
      at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("admin_activity")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return null;
    }
    return data as DbAdminActivity;
  } catch {
    return null;
  }
}

export async function clearAdminActivitiesFromDb(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("admin_activity")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    return !error;
  } catch {
    return false;
  }
}
