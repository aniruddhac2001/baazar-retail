"use client";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getVendors,
  getVendorStats,
  updateVendorStatus,
} from "@/lib/supabase/db";
import type { Vendor } from "@/lib/supabase/types";
import type { SafeAdmin, AdminUser, AdminActivity } from "../_lib/admins";
import {
  statusLabel,
  roleLabel,
  getAdminUsers,
  updateAdminUserDetails,
  resetAdminUsersToDefault,
  getAdminActivity,
  logAdminActivity,
  clearAdminActivity,
} from "../_lib/admins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportVendorsToExcel, getVendorFilename } from "@/lib/excel-export";
import {
  ShieldAlertIcon,
  UsersIcon,
  ClockIcon,
  CheckCircle2Icon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  SearchIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type VendorStatus =
  | "pending"
  | "accounts_approved"
  | "gst_approved"
  | "approved"
  | "rejected"
  | string;

/** Count real uploaded storage paths on a vendor row (not assumed docs). */
const VENDOR_DOC_FIELDS = [
  "panFileId",
  "tanFileId",
  "gstFileId",
  "proofOfAddressFileId",
  "msmedFileId",
  "chequeFileId",
] as const;

function countVendorDocuments(vendor: Vendor): number {
  let n = 0;
  for (const field of VENDOR_DOC_FIELDS) {
    const id = vendor[field];
    if (
      typeof id === "string" &&
      id.trim().length > 0 &&
      !id.startsWith("local-")
    ) {
      n += 1;
    }
  }
  return n;
}

function countAllDocuments(vendors: Vendor[]): number {
  return vendors.reduce((sum, v) => sum + countVendorDocuments(v), 0);
}

function StatusBadge({ status }: { status?: string }) {
  const s = status ?? "pending";
  if (s === "approved")
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
        Approved
      </Badge>
    );
  if (s === "rejected")
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">
        Rejected
      </Badge>
    );
  if (s === "accounts_approved")
    return (
      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
        Pending (GST)
      </Badge>
    );
  if (s === "gst_approved")
    return (
      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-0">
        Pending (IT)
      </Badge>
    );
  return (
    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0">
      Pending (Accounts)
    </Badge>
  );
}

function VendorProfileModal({
  vendor,
  onClose,
  onStatusUpdated,
  admin,
}: {
  vendor: Vendor | null;
  onClose: () => void;
  onStatusUpdated: () => void;
  admin: SafeAdmin;
}) {
  if (!vendor) return null;

  const current = vendor.status ?? "pending";
  const canActOnThis =
    admin.canCrud || admin.queue.includes(current);
  const canApprove = canActOnThis && current !== "approved" && current !== "rejected";
  const canReject = canActOnThis && current !== "rejected";

  const handleStatus = async (status: VendorStatus) => {
    try {
      await updateVendorStatus(vendor.id, status);
      const action =
        status === "rejected"
          ? "rejected"
          : status === "approved" ||
            status === "accounts_approved" ||
            status === "gst_approved"
            ? "approved"
            : status;
      logAdminActivity({
        adminId: admin.id,
        adminName: admin.displayName,
        adminRole: admin.role,
        action,
        vendorId: vendor.id,
        vendorName: vendor.name,
        vrfNumber: vendor.vrfNumber || undefined,
        detail: statusLabel(status),
      });
      toast.success(`Status updated: ${statusLabel(status)}`);
      onStatusUpdated();
      onClose();
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleApprove = () => {
    const next = admin.canCrud
      ? admin.role === "super"
        ? // super: advance one stage or fully approve if at end
        current === "pending"
          ? "accounts_approved"
          : current === "accounts_approved"
            ? "gst_approved"
            : "approved"
        : admin.approveTo || "approved"
      : admin.approveTo || "approved";
    handleStatus(next);
  };

  const fields: { label: string; value: string | undefined }[] = [
    { label: "Vendor ID", value: vendor.vrfNumber || undefined },
    { label: "Entity Name", value: vendor.name },
    { label: "Entity Type", value: vendor.entityType || undefined },
    { label: "Registered Address", value: vendor.address || undefined },
    { label: "District", value: vendor.district || undefined },
    { label: "Location", value: vendor.city || undefined },
    { label: "PIN Code", value: vendor.zip || undefined },
    { label: "Phone", value: vendor.phone ? `+91 ${vendor.phone}` : undefined },
    { label: "Email", value: vendor.email },
    { label: "PAN Number", value: vendor.panNumber || undefined },
    { label: "GSTIN", value: vendor.gstin || undefined },
    { label: "GST Status", value: vendor.gstStatus || undefined },
    { label: "Bank Name", value: vendor.bankName || undefined },
    { label: "Account Number", value: vendor.accountNumber || undefined },
    { label: "IFSC Code", value: vendor.ifscCode || undefined },
    { label: "Branch Name", value: vendor.branchName || undefined },
    { label: "Department Trading", value: vendor.departmentTrading || undefined },
    {
      label: "Goods/Services",
      value: vendor.goodsServices?.join(", "),
    },
    {
      label: "Submitted At",
      value: vendor.created_at
        ? new Date(vendor.created_at).toLocaleString("en-IN")
        : undefined,
    },
  ];

  return (
    <Dialog open={!!vendor} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            Vendor Details
            {vendor.vrfNumber && (
              <span className="text-sm font-mono text-muted-foreground">
                ({vendor.vrfNumber})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <StatusBadge status={vendor.status || undefined} />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => {
                  exportVendorsToExcel([vendor]);
                  toast.success(`Exported ${getVendorFilename(vendor)}.xlsx`);
                }}
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                Excel
              </Button>
              {canApprove && (
                <Button
                  size="sm"
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Approve
                </Button>
              )}
              {canReject && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleStatus("rejected")}
                >
                  Reject
                </Button>
              )}
            </div>
          </div>
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">Documents</p>
            <p className="text-xs text-muted-foreground">
              Only files actually uploaded by the vendor are listed as available.
            </p>
            {[
              {
                label: "PAN Certificate",
                available: !!(vendor.panFileId && String(vendor.panFileId).trim()),
              },
              {
                label: "GST Certificate",
                available: !!(vendor.gstFileId && String(vendor.gstFileId).trim()),
              },
              {
                label: "Cancelled Cheque",
                available: !!(vendor.chequeFileId && String(vendor.chequeFileId).trim()),
              },
              {
                label: "Address Proof",
                available: !!(
                  vendor.proofOfAddressFileId &&
                  String(vendor.proofOfAddressFileId).trim()
                ),
              },
              {
                label: "MSMED Certificate",
                available: !!(vendor.msmedFileId && String(vendor.msmedFileId).trim()),
              },
              {
                label: "TAN Certificate",
                available: !!(vendor.tanFileId && String(vendor.tanFileId).trim()),
              },
            ].map((doc) => (
              <div
                key={doc.label}
                className="flex items-center justify-between py-1.5 border-b last:border-0"
              >
                <div className="flex items-center gap-2">
                  <FileTextIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{doc.label}</span>
                </div>
                {doc.available ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-xs"
                    onClick={() =>
                      toast.info("Request physical files from the vendor.")
                    }
                  >
                    <DownloadIcon className="w-3.5 h-3.5" />
                    Download
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Not uploaded
                  </span>
                )}
              </div>
            ))}
            <Button
              size="sm"
              className="w-full mt-2 gap-2"
              variant="secondary"
              disabled={countVendorDocuments(vendor) === 0}
              onClick={() =>
                toast.info("Request bulk files from the vendor.")
              }
            >
              <DownloadIcon className="w-4 h-4" />
              Download All as ZIP
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map(({ label, value }) =>
              value ? (
                <div key={label} className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium break-words">{value}</p>
                </div>
              ) : null
            )}
          </div>
          {vendor.remarks && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Remarks</p>
              <p className="text-sm">{vendor.remarks}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ManageUsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    displayName: "",
  });

  useEffect(() => {
    setUsers(getAdminUsers());
  }, []);

  const startEdit = (u: AdminUser) => {
    setEditingId(u.id);
    setForm({
      username: u.username,
      password: u.password,
      displayName: u.displayName,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ username: "", password: "", displayName: "" });
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (!form.username.trim() || !form.password.trim() || !form.displayName.trim()) {
      toast.error("All fields are required.");
      return;
    }
    // Prevent duplicate usernames
    const clash = users.find(
      (u) => u.id !== editingId && u.username === form.username.trim()
    );
    if (clash) {
      toast.error("Username already in use by another admin.");
      return;
    }
    const next = updateAdminUserDetails(editingId, form);
    const target = next.find((u) => u.id === editingId);
    logAdminActivity({
      adminId: "1",
      adminName: "Rohit Singh",
      adminRole: "super",
      action: "updated_user",
      detail: target
        ? `Updated ${target.displayName} (${target.username})`
        : "Updated admin user",
    });
    setUsers(next);
    setEditingId(null);
    toast.success("User details updated.");
  };

  const handleReset = () => {
    if (!confirm("Reset all admin usernames/passwords to factory defaults?")) return;
    const next = resetAdminUsersToDefault();
    setUsers(next);
    setEditingId(null);
    toast.success("Admin users reset to defaults.");
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">Manage Admin Users</CardTitle>
          <Button size="sm" variant="outline" onClick={handleReset}>
            Reset to defaults
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Super Admin can update username, password and display name for all users.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-slate-200 p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {u.displayName}
                  <span className="ml-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {roleLabel(u.role)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {u.canCrud ? "Full CRUD access" : "Approve / Reject only"}
                </p>
              </div>
              {editingId !== u.id ? (
                <Button size="sm" variant="secondary" onClick={() => startEdit(u)}>
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {editingId === u.id ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Display name</Label>
                  <Input
                    value={form.displayName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, displayName: e.target.value }))
                    }
                    placeholder="Display name"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Username</Label>
                  <Input
                    value={form.username}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, username: e.target.value }))
                    }
                    placeholder="Username"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Password</Label>
                  <Input
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    placeholder="Password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                <p>
                  <span className="text-muted-foreground">Username: </span>
                  <span className="font-mono">{u.username}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Password: </span>
                  <span className="font-mono">{"•".repeat(Math.min(u.password.length, 8))}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Name: </span>
                  {u.displayName}
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActivityPanel() {
  const [items, setItems] = useState<AdminActivity[]>([]);

  const refresh = () => setItems(getAdminActivity());

  useEffect(() => {
    refresh();
  }, []);

  const handleClear = () => {
    if (!confirm("Clear all activity logs?")) return;
    clearAdminActivity();
    refresh();
    toast.success("Activity log cleared.");
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">Other Admins&apos; Activity</CardTitle>
          <Button size="sm" variant="outline" onClick={handleClear}>
            Clear log
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Approvals and rejections by Accounts, GST and IT desks.
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No activity yet. Actions by other admins will appear here.
          </p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {items.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    <span className="text-indigo-700">{a.adminName}</span>
                    <span className="text-slate-400 font-normal"> · </span>
                    <span
                      className={
                        a.action === "rejected"
                          ? "text-red-600"
                          : a.action === "approved"
                            ? "text-green-700"
                            : "text-slate-700"
                      }
                    >
                      {a.action}
                    </span>
                    {a.vendorName && (
                      <>
                        <span className="text-slate-400 font-normal"> · </span>
                        <span className="truncate">{a.vendorName}</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.vrfNumber && (
                      <span className="font-mono mr-2">{a.vrfNumber}</span>
                    )}
                    {a.detail && <span>{a.detail}</span>}
                    <span className="ml-2 text-slate-400">
                      {roleLabel(a.adminRole)}
                    </span>
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                  {new Date(a.at).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminDashboardInner({
  onLogout,
  admin,
}: {
  onLogout: () => void;
  admin: SafeAdmin;
}) {

  const [search, setSearch] = useState("");
  const [gstFilter, setGstFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [v, s] = await Promise.all([getVendors(), getVendorStats()]);
      setVendors(v ?? []);
      setStats(s);
    } catch {
      toast.error("Failed to load vendors from Supabase.");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredVendors = useMemo(() => {
    return (vendors ?? []).filter((v) => {
      const status = v.status ?? "pending";
      const inQueue = admin.canCrud
        ? true
        : admin.queue.includes(status);
      if (!inQueue) return false;

      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        (v.name ?? "").toLowerCase().includes(q) ||
        (v.vrfNumber ?? "").toLowerCase().includes(q) ||
        (v.panNumber ?? "").toLowerCase().includes(q) ||
        (v.email ?? "").toLowerCase().includes(q);
      const matchGst = gstFilter === "all" || v.gstStatus === gstFilter;
      const matchStatus = statusFilter === "all" || status === statusFilter;
      return matchSearch && matchGst && matchStatus;
    });
  }, [vendors, search, gstFilter, statusFilter, admin]);
  const GST_OPTIONS = [
    "Regular",
    "Composite",
    "Provisional",
    "Un-Registered",
    "Tax Deductor",
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div
          className="rounded-lg px-4 py-3 flex items-center justify-between gap-3"
          style={{ background: "#0A2540" }}
        >
          <div className="flex items-center gap-3">
            <ShieldAlertIcon className="w-5 h-5 text-white shrink-0" />
            <p className="text-white text-sm font-medium">
              {admin.canCrud
                ? "Super Admin — Full access (CRUD)"
                : admin.role === "accounts"
                  ? "Accounts desk — review new submissions"
                  : admin.role === "gst"
                    ? "GST desk — review Accounts-approved forms"
                    : "IT desk — final review"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/90 text-xs font-semibold hidden sm:inline">
              {admin.displayName}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10 text-xs"
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Super admin: only user CRUD + activity (no vendor table / stats) */}
        {admin.canCrud ? (
          <>
            <ManageUsersPanel />
            <ActivityPanel />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Submissions",
                  value: stats?.total ?? 0,
                  icon: (
                    <UsersIcon className="w-5 h-5" style={{ color: "#FF6B00" }} />
                  ),
                },
                {
                  label: "Pending Approvals",
                  value: stats?.pending ?? 0,
                  icon: <ClockIcon className="w-5 h-5 text-yellow-500" />,
                },
                {
                  label: "Verified Vendors",
                  value: stats?.approved ?? 0,
                  icon: <CheckCircle2Icon className="w-5 h-5 text-green-500" />,
                },
                {
                  label: "Documents Uploaded",
                  value: countAllDocuments(vendors ?? []),
                  icon: <FileTextIcon className="w-5 h-5 text-blue-500" />,
                },
              ].map((card) => (
                <Card key={card.label} className="shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        {card.label}
                      </CardTitle>
                      {card.icon}
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-3xl font-bold text-foreground">
                      {card.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filter section removed for Accounts / GST / IT admins */}

            <Card className="shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ background: "#0A2540" }}>
                      {[
                        "Vendor ID",
                        "Vendor Name",
                        "Entity Type",
                        "GST Status",
                        "Contact Email",
                        "Submission Date",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-white uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b">
                          {Array.from({ length: 8 }).map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <Skeleton className="h-4 w-24" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : filteredVendors.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-12 text-center text-muted-foreground text-sm"
                        >
                          No vendor submissions found.
                        </td>
                      </tr>
                    ) : (
                      filteredVendors.map((v) => (
                        <tr
                          key={v.id}
                          className="border-b hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                              {v.vrfNumber || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium max-w-[180px] truncate">
                            {v.name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {v.entityType}
                          </td>
                          <td className="px-4 py-3">{v.gstStatus}</td>
                          <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                            {v.email}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {v.created_at
                              ? new Date(v.created_at).toLocaleDateString("en-IN")
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={v.status || undefined} />
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1.5 text-xs"
                              onClick={() => setSelectedVendor(v)}
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>

      {!admin.canCrud && (
        <VendorProfileModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onStatusUpdated={load}
          admin={admin}
        />
      )}
    </div>
  );
}

export type AdminDashboardProps = {
  admin: SafeAdmin;
  onLogout: () => void;
};

export default function AdminDashboard({
  admin,
  onLogout,
}: AdminDashboardProps) {
  return (
    <div className="min-h-screen relative">
      <GradientBackground />
      <div className="relative z-10">
        <AdminDashboardInner admin={admin} onLogout={onLogout} />
      </div>
    </div>
  );
}