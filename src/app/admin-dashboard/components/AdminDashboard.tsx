"use client";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getVendors,
  getVendorStats,
  updateVendorStatus,
  deleteVendor,
} from "@/lib/supabase/db";
import type { Vendor } from "@/lib/supabase/types";
import type { SafeAdmin, AdminUser, AdminActivity, AdminRole } from "../_lib/admins";
import {
  statusLabel,
  roleLabel,
  getAdminUsers,
  updateAdminUserDetails,
  resetAdminUsersToDefault,
  getAdminActivity,
  logAdminActivity,
  saveAdminActivityLocal,
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
import {
  exportVendorsToExcel,
  getVendorFilename,
  downloadVendorDocumentsZip,
} from "@/lib/excel-export";
import { getVendorDocumentUrl, removeVendorDocument } from "@/lib/supabase/storage";
import {
  ShieldAlertIcon,
  UsersIcon,
  ClockIcon,
  CheckCircle2Icon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  SearchIcon,
  Trash2Icon,
  XCircleIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAdminActivityAsync } from "../_lib/admins";

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
    if (typeof id === "string" && id.trim().length > 0) {
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
  const canActOnThis = admin.canCrud || admin.queue.includes(current);
  const canApprove =
    canActOnThis && current !== "approved" && current !== "rejected";
  const canReject = canActOnThis && current !== "rejected";

  const handleStatus = async (status: VendorStatus) => {
    try {
      await updateVendorStatus(vendor.id, status, {
        adminName: admin.displayName,
        adminRole: admin.role,
        stage: admin.role,
      });
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

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to permanently delete vendor ${vendor.vrfNumber || vendor.name}? This will remove the record completely from Supabase database.`,
      )
    )
      return;
    try {
      await deleteVendor(vendor.id);
      logAdminActivity({
        adminId: admin.id,
        adminName: admin.displayName,
        adminRole: admin.role,
        action: "deleted",
        vendorId: vendor.id,
        vendorName: vendor.name,
        vrfNumber: vendor.vrfNumber || undefined,
        detail: "Deleted vendor record from database",
      });
      toast.success("Vendor record permanently deleted.");
      onStatusUpdated();
      onClose();
    } catch (err) {
      console.error("Failed to delete vendor:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete vendor.",
      );
    }
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
    {
      label: "Department Trading",
      value: vendor.departmentTrading || undefined,
    },
    {
      label: "Goods/Services",
      value: vendor.goodsServices?.join(", "),
    },
    { label: "Employee Ref Name", value: vendor.employeeRefName || undefined },
    {
      label: "Employee Ref Contact",
      value: vendor.employeeRefContact
        ? `+91 ${vendor.employeeRefContact}`
        : undefined,
    },
    {
      label: "Vendor Contact Person",
      value: vendor.vendorContactPerson
        ? `+91 ${vendor.vendorContactPerson}`
        : undefined,
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
              {admin.canCrud && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDelete}
                >
                  <Trash2Icon className="w-3.5 h-3.5" />
                  Delete
                </Button>
              )}
            </div>
          </div>
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Documents
                </p>
                <p className="text-xs text-muted-foreground">
                  Only files actually uploaded by the vendor are listed as
                  available.
                </p>
              </div>
              {!admin.canCrud && countVendorDocuments(vendor) > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 shrink-0"
                  onClick={() => downloadVendorDocumentsZip(vendor)}
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  Download ZIP
                </Button>
              )}
            </div>
            {[
              {
                label: "PAN Certificate",
                fileId: vendor.panFileId,
                name: "PAN_Certificate",
              },
              {
                label: "GST Certificate",
                fileId: vendor.gstFileId,
                name: "GST_Certificate",
              },
              {
                label: "Cancelled Cheque",
                fileId: vendor.chequeFileId,
                name: "Cancelled_Cheque",
              },
              {
                label: "Address Proof",
                fileId: vendor.proofOfAddressFileId,
                name: "Address_Proof",
              },
              {
                label: "MSMED Certificate",
                fileId: vendor.msmedFileId,
                name: "MSMED_Certificate",
              },
              {
                label: "TAN Certificate",
                fileId: vendor.tanFileId,
                name: "TAN_Certificate",
              },
            ].map((doc) => {
              const isUploaded = !!(
                doc.fileId && String(doc.fileId).trim().length > 0
              );
              return (
                <div
                  key={doc.label}
                  className="flex items-center justify-between py-1.5 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{doc.label}</span>
                  </div>
                  {isUploaded ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                      onClick={async () => {
                        try {
                          let url: string | null = null;
                          if (doc.fileId?.startsWith("data:")) {
                            url = doc.fileId;
                          } else if (doc.fileId) {
                            url = await getVendorDocumentUrl(doc.fileId);
                          }
                          if (url) {
                            const link = document.createElement("a");
                            link.href = url;
                            link.target = "_blank";
                            link.download = `${getVendorFilename(vendor)}_${doc.name}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            toast.success(`Opening ${doc.label}`);
                          } else {
                            toast.error("Document URL could not be opened.");
                          }
                        } catch (err) {
                          console.error("Document download error:", err);
                          toast.error("Could not download document.");
                        }
                      }}
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      View / Download
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Not uploaded
                    </span>
                  )}
                </div>
              );
            })}
            <Button
              size="sm"
              className="w-full mt-2 gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
              variant="outline"
              disabled={countVendorDocuments(vendor) === 0}
              onClick={() => downloadVendorDocumentsZip(vendor)}
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
              ) : null,
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
    if (
      !form.username.trim() ||
      !form.password.trim() ||
      !form.displayName.trim()
    ) {
      toast.error("All fields are required.");
      return;
    }
    // Prevent duplicate usernames
    const clash = users.find(
      (u) => u.id !== editingId && u.username === form.username.trim(),
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
    if (!confirm("Reset all admin usernames/passwords to factory defaults?"))
      return;
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
          Super Admin can update username, password and display name for all
          users.
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
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => startEdit(u)}
                >
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
                  <span className="font-mono">
                    {"•".repeat(Math.min(u.password.length, 8))}
                  </span>
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



function ActivityPanel({
  vendors,
  onRefreshRequested,
}: {
  vendors: Vendor[];
  onRefreshRequested?: () => void;
}) {
  const [items, setItems] = useState<AdminActivity[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const list = await fetchAdminActivityAsync(vendors);
      setItems(list);
    } catch {
      setItems(getAdminActivity());
    } finally {
      setSyncing(false);
      if (onRefreshRequested) onRefreshRequested();
    }
  }, [vendors, onRefreshRequested]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleClear = () => {
    if (!confirm("Clear activity log view?")) return;
    saveAdminActivityLocal([]);
    setItems([]);
    toast.success("Activity log cleared from display.");
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                Other Admins&apos; Activity Log
              </CardTitle>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[11px] px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Synced with DB
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Approvals and rejections by Accounts, GST and IT desks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={refresh}
              disabled={syncing}
            >
              <RefreshCwIcon
                className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`}
              />
              Sync DB
            </Button>
            <Button size="sm" variant="outline" onClick={handleClear}>
              Clear log
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No activity yet. Actions by other admins will appear here
            automatically.
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
                          ? "text-red-600 font-semibold"
                          : a.action === "approved"
                            ? "text-green-700 font-semibold"
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
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const [v, s] = await Promise.all([getVendors(), getVendorStats()]);
      const fetchedVendors = v ?? [];
      setVendors(fetchedVendors);
      setStats(s);
      const acts = await fetchAdminActivityAsync(fetchedVendors);
      setActivities(acts);
    } catch {
      toast.error("Failed to load vendors from Supabase.");
      setVendors((prev) => prev ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    const interval = setInterval(() => {
      load(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const filteredVendors = useMemo(() => {
    const getRejectionRole = (v: Vendor): string => {
      if (v.status !== "rejected") return "";
      const rej = activities.find(
        (a) =>
          a.action === "rejected" &&
          (a.vendorId === v.id || (a.vrfNumber && a.vrfNumber === v.vrfNumber)),
      );
      if (rej?.adminRole) return rej.adminRole;
      const rejRole = (
        v.rejectedRole ||
        v.rejectedAtStage ||
        ""
      ).toLowerCase();
      if (rejRole) return rejRole;
      const rem = (v.remarks || "").toLowerCase();
      if (rem.includes("gst")) return "gst";
      if (rem.includes("it")) return "it";
      return "accounts";
    };

    return (vendors ?? [])
      .filter((v) => {
        const status = v.status ?? "pending";

        // Desk pipeline access control:
        if (admin.role === "accounts") {
          // Accounts desk sees pending and vendors rejected at Accounts stage
          if (status === "rejected") {
            const rejRole = getRejectionRole(v);
            if (rejRole !== "accounts") return false;
          }
        } else if (admin.role === "gst") {
          // GST desk only sees applications that reached GST desk
          if (status === "pending") return false;
          if (status === "rejected") {
            const rejRole = getRejectionRole(v);
            if (rejRole === "accounts" || rejRole === "it") return false;
          }
        } else if (admin.role === "it") {
          // IT desk only sees applications that reached IT desk
          if (status === "pending" || status === "accounts_approved")
            return false;
          if (status === "rejected") {
            const rejRole = getRejectionRole(v);
            if (rejRole !== "it") return false;
          }
        }

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
      })
      .sort((a, b) => {
        const vrfA = a.vrfNumber || "";
        const vrfB = b.vrfNumber || "";
        return vrfA.localeCompare(vrfB, undefined, { numeric: true });
      });
  }, [vendors, activities, search, gstFilter, statusFilter, admin]);

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
                ? "Super Admin — Full access & Database Sync"
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



        {admin.canCrud && (
          <>
            <ManageUsersPanel />
            <ActivityPanel vendors={vendors ?? []} onRefreshRequested={load} />
          </>
        )}

        {/* Controls and Vendor Table */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b bg-slate-50/50">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold">
                Vendor Applications ({filteredVendors.length})
              </CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <SearchIcon className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search VRF / Name / PAN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 text-xs shrink-0"
                  onClick={() => {
                    if (!filteredVendors || filteredVendors.length === 0) {
                      toast.error("No matching vendor data to export.");
                      return;
                    }
                    exportVendorsToExcel(filteredVendors, {
                      isSuperAdminReport: admin.canCrud,
                    });
                    toast.success(
                      `Exported ${filteredVendors.length} vendor record(s) to Excel.`,
                    );
                  }}
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
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
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-muted-foreground text-sm"
                    >
                      No vendor submissions found matching current search.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedVendor(v)}
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
                      <td
                        className="px-4 py-3 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (
                              !confirm(
                                `Are you sure you want to permanently delete vendor ${v.vrfNumber || v.name}? This will remove the data completely from here and from the database.`,
                              )
                            )
                              return;

                            // Optimistically update local state immediately
                            setVendors((prev) =>
                              prev ? prev.filter((item) => item.id !== v.id) : [],
                            );

                            try {
                              // Delete document files if any
                              const fields = [
                                "panFileId",
                                "tanFileId",
                                "gstFileId",
                                "proofOfAddressFileId",
                                "msmedFileId",
                                "chequeFileId",
                              ] as const;
                              for (const f of fields) {
                                const storageId = v[f];
                                if (
                                  typeof storageId === "string" &&
                                  storageId.trim()
                                ) {
                                  try {
                                    await removeVendorDocument(storageId);
                                  } catch {
                                    /* ignore if file missing */
                                  }
                                }
                              }

                              // Delete vendor record from database
                              await deleteVendor(v.id);

                              logAdminActivity({
                                adminId: admin.id,
                                adminName: admin.displayName,
                                adminRole: admin.role,
                                action: "deleted",
                                vendorId: v.id,
                                vendorName: v.name,
                                vrfNumber: v.vrfNumber || undefined,
                                detail: "Permanently deleted vendor record",
                              });

                              toast.success(
                                "Vendor data permanently deleted from database.",
                              );
                              load(false);
                            } catch (err) {
                              console.error("Failed to delete vendor:", err);
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : "Failed to delete vendor from database.",
                              );
                              load(false);
                            }
                          }}
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <VendorProfileModal
        vendor={selectedVendor}
        onClose={() => setSelectedVendor(null)}
        onStatusUpdated={load}
        admin={admin}
      />
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
