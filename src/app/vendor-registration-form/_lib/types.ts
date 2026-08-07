export type VendorFormStep = 1 | 2 | 3 | 4 | 5;

export const ENTITY_TYPES = [
  "Individual",
  "Limited",
  "Private Limited",
  "Proprietorship",
  "Limited Liability Partnership",
  "Partnership",
  "Trust",
  "Co-Operative",
  "HUF",
] as const;

export const GST_STATUSES = [
  "Registered",
  "Unregistered",
  "Composition",
] as const;

export const ADDRESS_PROOF_TYPES = [
  "Utility Bill",
  "Lease Agreement",
  "Property Tax Receipt",
  "Bank Statement",
  "Aadhaar",
  "Other",
] as const;

export const MSMED_TYPES = [
  "Micro",
  "Small",
  "Medium",
] as const;

export const DEPARTMENTS = [
  "Men's Wear",
  "Ladies Wear",
  "Kids Wear",
  "Winter Garments",
  "Accessories",
] as const;

export const DEPARTMENT_TRADING = DEPARTMENTS;

export const GOODS_SERVICES_OPTIONS = [
  "Trading Goods - Merchandise",
  "Trading Goods - Apparels",
  "Trading Goods - Accessories",
  "Non Trading Goods",
  "Services",
] as const;

export const GOODS_SERVICES = GOODS_SERVICES_OPTIONS;

/** Supabase Storage file reference (path inside the VRF bucket). */
export type UploadedFileRef = {
  storageId: string;
  fileName: string;
} | null;

export interface VendorFormData {
  entityName: string;
  entityType: string;
  registeredAddress: string;
  registeredDistrict: string;
  registeredLocation: string;
  registeredPinCode: string;
  registeredPhone: string;
  registeredPhoneAdditional: string;
  registeredEmail: string;
  sameAsRegistered: boolean;

  commAddress: string;
  commDistrict: string;
  commLocation: string;
  commPinCode: string;
  commPhone: string;
  commEmail: string;

  panNumber: string;
  panFile: UploadedFileRef;
  hasTan: boolean;
  tanNumber: string;
  tanFile: UploadedFileRef;
  gstStatus: string;
  gstin: string;
  gstFile: UploadedFileRef;
  gstRegistrationDate: string;
  placeOfBusiness: string;
  proofOfAddressType: string;
  proofOfAddressFile: UploadedFileRef;

  isMsmed: boolean;
  msmedLineOfBusiness: string;
  msmedType: string;
  msmedFile: UploadedFileRef;

  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;
  chequeLabel: string;
  chequeFile: UploadedFileRef;
  branchName: string;
  branchAddress: string;

  goodsServices: string[];
  departmentTrading: string;
  hasBaazarReference: boolean | null;
  employeeRefName: string;
  employeeRefContact: string;
  vendorContactPerson: string;

  agreeNda: boolean;
  agreeTerms: boolean;
  remarks: string;
}

export interface StepProps {
  data: VendorFormData;
  onChange: (updates: Partial<VendorFormData>) => void;
  errors: Partial<Record<keyof VendorFormData, string>>;
}

export const defaultVendorFormData: VendorFormData = {
  entityName: "",
  entityType: "",
  registeredAddress: "",
  registeredDistrict: "",
  registeredLocation: "",
  registeredPinCode: "",
  registeredPhone: "",
  registeredPhoneAdditional: "",
  registeredEmail: "",
  sameAsRegistered: true,
  commAddress: "",
  commDistrict: "",
  commLocation: "",
  commPinCode: "",
  commPhone: "",
  commEmail: "",
  panNumber: "",
  panFile: null,
  hasTan: false,
  tanNumber: "",
  tanFile: null,
  gstStatus: "",
  gstin: "",
  gstFile: null,
  gstRegistrationDate: "",
  placeOfBusiness: "",
  proofOfAddressType: "",
  proofOfAddressFile: null,
  isMsmed: false,
  msmedLineOfBusiness: "",
  msmedType: "",
  msmedFile: null,
  bankName: "",
  bankAccountNumber: "",
  ifscCode: "",
  chequeLabel: "",
  chequeFile: null,
  branchName: "",
  branchAddress: "",
  goodsServices: [],
  departmentTrading: "",
  hasBaazarReference: null,
  employeeRefName: "",
  employeeRefContact: "",
  vendorContactPerson: "",
  agreeNda: false,
  agreeTerms: false,
  remarks: "",
};