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
  payload: Record<string, unknown>
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
  return (data as Vendor[]) ?? [];
}

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw new Error(formatSupabaseError(error));
  return (data as User[]) ?? [];
}

export async function createVendor(vendor: VendorInsert) {
  const payload = sanitizeVendorPayload(
    vendor as unknown as Record<string, unknown>
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
  return data as Vendor | null;
}

export async function searchVendors(query: string) {
  const q = query.trim();
  if (!q) return getVendors();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .or(
      `vrfNumber.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(formatSupabaseError(error));
  return (data as Vendor[]) ?? [];
}

export async function updateVendorStatus(
  id: string,
  status: "pending" | "approved" | "rejected" | string
) {
  const { data, error } = await supabase
    .from("vendors")
    .update({ status })
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
    pending: vendors.filter((v) => (v.status ?? "pending") === "pending").length,
    approved: vendors.filter((v) => v.status === "approved").length,
    rejected: vendors.filter((v) => v.status === "rejected").length,
  };
}

export async function getVendorFileUrls(
  vendor: Vendor
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
    })
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
      { onConflict: "id" }
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