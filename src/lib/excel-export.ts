import * as XLSX from "xlsx";
import JSZip from "jszip";
import type { Vendor } from "@/lib/supabase/types";
import { getVendorDocumentUrl } from "./supabase/storage";
import { getAdminActivity } from "@/app/admin-dashboard/_lib/admins";
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
    "S.No.",
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
  ];

  if (!isSuperAdminReport) {
    headers.push("Status");
  }

  headers.push("Submitted At");

  if (isSuperAdminReport) {
    headers.push("Accounts Desk Status", "GST Desk Status", "IT Desk Status");
  }

  const rows: (string | number)[][] = [headers];
  const activities = getAdminActivity();

  // Sort vendors in ascending serial order (001, 002, 003...)
  const sortedVendors = [...vendors].sort((a, b) => {
    const getSeq = (v: Vendor) => {
      if (v.vrfNumber) {
        const parts = v.vrfNumber.split("/");
        if (parts.length >= 3) {
          const num = parseInt(parts[parts.length - 1].trim(), 10);
          if (!isNaN(num)) return num;
        }
        const match = v.vrfNumber.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num)) return num;
        }
      }
      return null;
    };

    const seqA = getSeq(a);
    const seqB = getSeq(b);

    if (seqA !== null && seqB !== null) {
      return seqA - seqB;
    }

    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateA - dateB;
  });

  sortedVendors.forEach((v, index) => {
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
      const rejAct = activities.find(
        (a) =>
          a.action === "rejected" &&
          (a.vendorId === v.id || (a.vrfNumber && a.vrfNumber === v.vrfNumber))
      );

      const rejRole = rejAct?.adminRole;

      if (rejRole === "gst") {
        accountsStatus = "Approved";
        gstStatus = "Rejected";
        itStatus = "Pending";
      } else if (rejRole === "it") {
        accountsStatus = "Approved";
        gstStatus = "Approved";
        itStatus = "Rejected";
      } else {
        // Rejected at Accounts stage (or default)
        accountsStatus = "Rejected";
        gstStatus = "Pending";
        itStatus = "Pending";
      }
    }

    const cell = (str: string | null | undefined): string => {
      if (!str || typeof str !== "string" || !str.trim()) return "—";
      return str.trim();
    };

    const phoneCell = (str: string | null | undefined): string => {
      if (!str || typeof str !== "string" || !str.trim()) return "—";
      const cleaned = str.trim();
      return cleaned.startsWith("+91") ? cleaned : `+91 ${cleaned}`;
    };

    const row: (string | number)[] = [
      index + 1,
      // Group 1
      cell(v.vrfNumber),
      cell(v.name),
      cell(v.entityType),

      // Group 2
      cell(v.address),
      cell(v.district),
      cell(v.city),
      cell(v.zip),
      phoneCell(v.phone),
      phoneCell(v.registeredPhoneAdditional),
      cell(v.email),

      // Group 3
      v.sameAsRegistered ? "Yes" : "No",
      v.sameAsRegistered ? "—" : cell(v.commAddress),
      v.sameAsRegistered ? "—" : cell(v.commDistrict),
      v.sameAsRegistered ? "—" : cell(v.commLocation),
      v.sameAsRegistered ? "—" : cell(v.commPinCode),
      v.sameAsRegistered ? "—" : phoneCell(v.commPhone),
      v.sameAsRegistered ? "—" : cell(v.commEmail),

      // Group 4
      cell(v.panNumber),
      v.hasTan ? "Yes" : "No",
      v.hasTan ? cell(v.tanNumber) : "—",
      cell(v.gstStatus),
      cell(v.gstin),
      cell(v.gstRegistrationDate),
      cell(v.placeOfBusiness),
      cell(v.proofOfAddressType),

      // Group 5
      v.isMsmed ? "Yes" : "No",
      v.isMsmed ? cell(v.msmedType) : "—",
      v.isMsmed ? cell(v.msmedLineOfBusiness) : "—",
      cell(v.bankName),
      v.accountNumber ? String(v.accountNumber).trim() : "—",
      cell(v.ifscCode),
      cell(v.chequeLabel),
      cell(v.branchName),
      cell(v.branchAddress),

      // Group 6
      Array.isArray(v.goodsServices) && v.goodsServices.length > 0
        ? v.goodsServices.join(", ")
        : cell(v.goodsServices as unknown as string),
      cell(v.departmentTrading),
      phoneCell(v.vendorContactPerson),
      v.employeeRefName && v.employeeRefName.trim() ? "Yes" : "No",
      cell(v.employeeRefName),
      phoneCell(v.employeeRefContact),
      cell(v.remarks),
    ];

    if (!isSuperAdminReport) {
      row.push(v.status ?? "pending");
    }

    row.push(
      v.created_at
        ? new Date(v.created_at).toLocaleDateString("en-IN")
        : "—"
    );

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
