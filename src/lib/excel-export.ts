import * as XLSX from "xlsx";
import type { Vendor } from "@/lib/supabase/types";

/**
 * Sanitizes VRF Number / Vendor Unique ID for a safe filename.
 * E.g., "VRF / 07-08-2026 / 001" -> "VRF_07-08-2026_001"
 */
export function getVendorFilename(vendor: Vendor): string {
  const rawId = vendor.vrfNumber || vendor.id || "vendor";
  return rawId.replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_").trim();
}

/**
 * Exports single or multiple vendors to an Excel (.xlsx) file in horizontal tabular format
 * matching Image 1 layout with blank spacer columns between major sections.
 * The file name is set to the Vendor Unique ID when exporting a single vendor.
 */
export function exportVendorsToExcel(vendors: Vendor[]) {
  if (!vendors || vendors.length === 0) return;

  const wb = XLSX.utils.book_new();

  const fileName =
    vendors.length === 1
      ? `${getVendorFilename(vendors[0])}.xlsx`
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

  const rows: (string | number)[][] = [headers];

  vendors.forEach((v) => {
    rows.push([
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
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set appropriate column widths
  ws["!cols"] = headers.map((h) => ({
    wch: Math.max(h.length + 4, 16),
  }));

  // Force Account Number column to Text format ('s' type and '@' format)
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
