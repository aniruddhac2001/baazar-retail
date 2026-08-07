/** Maps vendor registration form → Supabase `public.vendors` table.
 *  Column names MUST match supabase/schema.sql exactly.
 *  NO legacy fields: category, state, description, website, routingNumber
 */

export const VENDOR_TABLE_COLUMNS = [
  "name",
  "entityType",
  "address",
  "district",
  "city",
  "zip",
  "phone",
  "registeredPhoneAdditional",
  "email",
  "sameAsRegistered",
  "commAddress",
  "commDistrict",
  "commLocation",
  "commPinCode",
  "commPhone",
  "commEmail",
  "panNumber",
  "panFileId",
  "hasTan",
  "tanNumber",
  "tanFileId",
  "gstStatus",
  "gstin",
  "gstFileId",
  "gstRegistrationDate",
  "placeOfBusiness",
  "proofOfAddressType",
  "proofOfAddressFileId",
  "isMsmed",
  "msmedLineOfBusiness",
  "msmedType",
  "msmedFileId",
  "bankName",
  "accountNumber",
  "ifscCode",
  "chequeLabel",
  "chequeFileId",
  "branchName",
  "branchAddress",
  "goodsServices",
  "departmentTrading",
  "employeeRefName",
  "employeeRefContact",
  "vendorContactPerson",
  "remarks",
  "status",
  "vrfNumber",
] as const;

export type VendorColumn = (typeof VENDOR_TABLE_COLUMNS)[number];

export interface Vendor {
  id: string;
  name: string;
  entityType?: string | null;
  address?: string | null;
  district?: string | null;
  city?: string | null;
  zip?: string | null;
  phone?: string | null;
  registeredPhoneAdditional?: string | null;
  email: string;
  sameAsRegistered?: boolean | null;
  commAddress?: string | null;
  commDistrict?: string | null;
  commLocation?: string | null;
  commPinCode?: string | null;
  commPhone?: string | null;
  commEmail?: string | null;
  panNumber?: string | null;
  panFileId?: string | null;
  hasTan?: boolean | null;
  tanNumber?: string | null;
  tanFileId?: string | null;
  gstStatus?: string | null;
  gstin?: string | null;
  gstFileId?: string | null;
  gstRegistrationDate?: string | null;
  placeOfBusiness?: string | null;
  proofOfAddressType?: string | null;
  proofOfAddressFileId?: string | null;
  isMsmed?: boolean | null;
  msmedLineOfBusiness?: string | null;
  msmedType?: string | null;
  msmedFileId?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  chequeLabel?: string | null;
  chequeFileId?: string | null;
  branchName?: string | null;
  branchAddress?: string | null;
  goodsServices?: string[] | null;
  departmentTrading?: string | null;
  employeeRefName?: string | null;
  employeeRefContact?: string | null;
  vendorContactPerson?: string | null;
  remarks?: string | null;
  status?: "pending" | "approved" | "rejected" | string | null;
  vrfNumber?: string | null;
  created_at?: string | null;
}

export type VendorInsert = Partial<Omit<Vendor, "id" | "created_at">> & {
  name: string;
  email: string;
};

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  token_identifier?: string;
  created_at?: string;
}