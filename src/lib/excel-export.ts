import * as XLSX from "xlsx";
import JSZip from "jszip";
import type { Vendor } from "@/lib/supabase/types";
import { getVendorDocumentUrl } from "./supabase/storage";
import { toast } from "sonner";

/**
 * Sanitizes VRF Number / Vendor Unique ID for a safe filename.
 * E.g., "VRF / 07-08-2026 / 001" -> "VRF_07-08-2026_001"
 */
export function getVendorFilename(vendor: Vendor): string {
  const rawId = vendor.vrfNumber || vendor.id || "vendor";
  return rawId.replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_").trim();
}

/**
 * Exports vendors to an Excel (.xlsx) file.
 * If isSuperAdminReport is true, appends 3 extra columns after Submitted At:
 * Accounts Desk Status, GST Desk Status, IT Desk Status.
 */
export function exportVendorsToExcel(
  vendors: Vendor[],
  options?: { isSuperAdminReport?: boolean }
) {
  if (!vendors || vendors.length === 0) return;

  const isSuperAdminReport = options?.isSuperAdminReport ?? false;
  const wb = XLSX.utils.book_new();

  const fileName =
    vendors.length === 1
      ? `${getVendorFilename(vendors[0])}.xlsx`
      : isSuperAdminReport
        ? `baazar-super-admin-report-${new Date().toISOString().split("T")[0]}.xlsx`
        : `baazar-vendors-export-${new Date().toISOString().split("T")[0]}.xlsx`;

  const headers = [
    // Group 1: Basic & Entity
    "Vendor ID",
    "Entity Name",
    "Entity Type",

    // Group 2: Registered Address & Phone
    "Registered Address",
    "District",
    "City",
    "PIN",
    "Registered Phone",
    "Additional Phone",
    "Registered Email",

    // Group 3: Communication Address
    "Same as Registered",
    "Comm Address",
    "Comm District",
    "Comm City",
    "Comm PIN",
    "Comm Phone",
    "Comm Email",

    // Group 4: Tax & Statutory
    "PAN Number",
    "Has TAN",
    "TAN Number",
    "GST Status",
    "GSTIN",
    "GST Reg Date",
    "Place of Business",
    "Proof of Address Type",

    // Group 5: MSMED & Banking
    "Is MSMED",
    "MSMED Type",
    "MSMED Business",
    "Bank Name",
    "Account Number",
    "IFSC Code",
    "Name on Account",
    "Branch Name",
    "Branch Address",

    // Group 6: Operational & Reference Details
    "Goods/Services",
    "Department Trading",
    "Vendor Contact Person",
    "Baazar Reference",
    "Employee Ref Name",
    "Employee Ref Contact",
    "Remarks",
    "Status",
    "Submitted At",
  ];

  if (isSuperAdminReport) {
    headers.push("Accounts Desk Status", "GST Desk Status", "IT Desk Status");
  }

  const rows: (string | number)[][] = [headers];

  vendors.forEach((v) => {
    const status = v.status ?? "pending";
    let accountsStatus = "Pending";
    let gstStatus = "Pending";
    let itStatus = "Pending";

    if (status === "accounts_approved") {
      accountsStatus = "Approved";
      gstStatus = "Pending";
      itStatus = "Pending";
    } else if (status === "gst_approved") {
      accountsStatus = "Approved";
      gstStatus = "Approved";
      itStatus = "Pending";
    } else if (status === "approved") {
      accountsStatus = "Approved";
      gstStatus = "Approved";
      itStatus = "Approved";
    } else if (status === "rejected") {
      accountsStatus = "Rejected";
      gstStatus = "Rejected";
      itStatus = "Rejected";
    }

    const row: (string | number)[] = [
      // Group 1
      v.vrfNumber ?? "—",
      v.name ?? "—",
      v.entityType ?? "—",

      // Group 2
      v.address ?? "—",
      v.district ?? "—",
      v.city ?? "—",
      v.zip ?? "—",
      v.phone ? `+91 ${v.phone}` : "—",
      v.registeredPhoneAdditional ? `+91 ${v.registeredPhoneAdditional}` : "—",
      v.email ?? "—",

      // Group 3
      v.sameAsRegistered ? "Yes" : "No",
      v.sameAsRegistered ? "—" : v.commAddress ?? "—",
      v.sameAsRegistered ? "—" : v.commDistrict ?? "—",
      v.sameAsRegistered ? "—" : v.commLocation ?? "—",
      v.sameAsRegistered ? "—" : v.commPinCode ?? "—",
      v.sameAsRegistered ? "—" : v.commPhone ? `+91 ${v.commPhone}` : "—",
      v.sameAsRegistered ? "—" : v.commEmail ?? "—",

      // Group 4
      v.panNumber ?? "—",
      v.hasTan ? "Yes" : "No",
      v.hasTan ? v.tanNumber ?? "—" : "—",
      v.gstStatus ?? "—",
      v.gstin ?? "—",
      v.gstRegistrationDate ?? "—",
      v.placeOfBusiness ?? "—",
      v.proofOfAddressType ?? "—",

      // Group 5
      v.isMsmed ? "Yes" : "No",
      v.isMsmed ? v.msmedType ?? "—" : "—",
      v.isMsmed ? v.msmedLineOfBusiness ?? "—" : "—",
      v.bankName ?? "—",
      v.accountNumber ? String(v.accountNumber) : "—",
      v.ifscCode ?? "—",
      v.chequeLabel ?? "—",
      v.branchName ?? "—",
      v.branchAddress ?? "—",

      // Group 6
      Array.isArray(v.goodsServices)
        ? v.goodsServices.join(", ")
        : v.goodsServices ?? "—",
      v.departmentTrading ?? "—",
      v.vendorContactPerson ? `+91 ${v.vendorContactPerson}` : "—",
      v.employeeRefName ? "Yes" : "No",
      v.employeeRefName ?? "—",
      v.employeeRefContact ? `+91 ${v.employeeRefContact}` : "—",
      v.remarks ?? "—",
      v.status ?? "pending",
      v.created_at
        ? new Date(v.created_at).toLocaleDateString("en-IN")
        : "—",
    ];

    if (isSuperAdminReport) {
      row.push(accountsStatus, gstStatus, itStatus);
    }

    rows.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws["!cols"] = headers.map((h) => ({
    wch: Math.max(h.length + 4, 16),
  }));

  const accountNumColIdx = headers.indexOf("Account Number");
  if (accountNumColIdx !== -1 && ws["!ref"]) {
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: accountNumColIdx });
      if (ws[cellAddress]) {
        ws[cellAddress].t = "s";
        ws[cellAddress].z = "@";
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "Vendors");
  XLSX.writeFile(wb, fileName);
}

/**
 * Downloads all uploaded documents for a vendor as a single .zip file.
 * Available for Accounts, GST, and IT desk admins.
 */
export async function downloadVendorDocumentsZip(vendor: Vendor) {
  const fields = [
    { key: "panFileId", name: "PAN_Certificate" },
    { key: "gstFileId", name: "GST_Certificate" },
    { key: "chequeFileId", name: "Cancelled_Cheque" },
    { key: "proofOfAddressFileId", name: "Address_Proof" },
    { key: "msmedFileId", name: "MSMED_Certificate" },
    { key: "tanFileId", name: "TAN_Certificate" },
  ] as const;

  const zip = new JSZip();
  let count = 0;

  for (const { key, name } of fields) {
    const fileId = vendor[key];
    if (typeof fileId === "string" && fileId.trim().length > 0) {
      try {
        let blob: Blob | null = null;
        if (fileId.startsWith("data:")) {
          const res = await fetch(fileId);
          blob = await res.blob();
        } else {
          const url = await getVendorDocumentUrl(fileId);
          if (url) {
            const res = await fetch(url);
            blob = await res.blob();
          }
        }
        if (blob) {
          zip.file(`${name}.pdf`, blob);
          count++;
        }
      } catch (err) {
        console.warn(`Could not load document ${name}:`, err);
      }
    }
  }

  if (count === 0) {
    toast.error("No uploaded documents found for this vendor.");
    return;
  }

  const content = await zip.generateAsync({ type: "blob" });
  const filename = `${getVendorFilename(vendor)}_documents.zip`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(content);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  toast.success(`Downloaded ${filename}`);
}
