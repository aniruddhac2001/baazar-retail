"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { Step1 } from "./_components/step1";
import { Step2 } from "./_components/step2";
import { Step3 } from "./_components/step3";
import { Step4 } from "./_components/step4";
import { Step5 } from "./_components/step5";
import { SuccessModal } from "./_components/success-modal";
import { DuplicateWarningModal } from "./_components/duplicate-warning-modal";
import { Navbar } from "@/components/ui/Navbar";
import {
  type VendorFormData,
  defaultVendorFormData,
} from "./_lib/types";
import { submitVendorRegistration, updateVendorVrf, findDuplicateVendor } from "@/lib/supabase/db";
import { generateVrfNumber } from "./_lib/vrf";
import type { Vendor } from "@/lib/supabase/types";

const TOTAL_STEPS = 5;
const DRAFT_KEY = "baazar_vendor_registration_draft";

type DraftPayload = {
  step: number;
  data: VendorFormData;
  savedAt: string;
};

function loadDraft(): DraftPayload | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPayload;
    if (!parsed?.data || typeof parsed.step !== "number") return null;
    return {
      step: Math.min(Math.max(1, parsed.step), TOTAL_STEPS),
      data: { ...defaultVendorFormData, ...parsed.data },
      savedAt: parsed.savedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function saveDraft(step: number, data: VendorFormData) {
  try {
    const payload: DraftPayload = {
      step,
      data,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function clearDraftStorage() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

const STEP_LABELS = [
  "Entity & Contact",
  "Communication",
  "Tax & Statutory",
  "MSMED & Banking",
  "Operational",
];

function validateStep(
  step: number,
  data: VendorFormData
): Partial<Record<keyof VendorFormData, string>> {
  const errs: Partial<Record<keyof VendorFormData, string>> = {};

  if (step === 1) {
    if (!data.entityName.trim()) errs.entityName = "Entity name is required.";
    if (!data.entityType) errs.entityType = "Please select an entity type.";
    if (!data.registeredAddress.trim()) errs.registeredAddress = "Address is required.";
    if (!data.registeredDistrict.trim()) errs.registeredDistrict = "District is required.";
    if (!data.registeredLocation.trim()) errs.registeredLocation = "Location is required.";
    if (data.registeredPinCode.length !== 6) errs.registeredPinCode = "Enter a valid 6-digit PIN.";
    if (data.registeredPhone.length !== 10) errs.registeredPhone = "Enter a valid 10-digit phone.";
    if (!data.registeredEmail.includes("@")) errs.registeredEmail = "Enter a valid email.";
  }

  if (step === 2 && !data.sameAsRegistered) {
    if (!data.commAddress.trim()) errs.commAddress = "Address is required.";
    if (!data.commDistrict.trim()) errs.commDistrict = "District is required.";
    if (!data.commLocation.trim()) errs.commLocation = "Location is required.";
    if (data.commPinCode.length !== 6) errs.commPinCode = "Enter a valid 6-digit PIN.";
    if (data.commPhone.length !== 10) errs.commPhone = "Enter a valid 10-digit phone.";
    if (!data.commEmail.includes("@")) errs.commEmail = "Enter a valid email.";
  }

  if (step === 3) {
    if (data.panNumber.length !== 10) errs.panNumber = "PAN must be 10 characters.";
    if (!data.gstStatus) errs.gstStatus = "Select GST status.";
    if (
      (data.gstStatus === "Registered" || data.gstStatus === "Composition") &&
      data.gstin.length !== 15
    ) {
      errs.gstin = "GSTIN must be 15 characters.";
    }
  }

  if (step === 4) {
    if (!data.bankName.trim()) errs.bankName = "Bank name is required.";
    if (!data.bankAccountNumber.trim()) errs.bankAccountNumber = "Account number is required.";
    if (data.ifscCode.length !== 11) errs.ifscCode = "IFSC must be 11 characters.";
    if (!data.chequeLabel.trim()) errs.chequeLabel = "Name on account is required.";
  }

  if (step === 5) {
    if (!data.branchName.trim()) errs.branchName = "Branch name is required.";
    if (!data.branchAddress.trim()) errs.branchAddress = "Branch address is required.";
    if (data.goodsServices.length === 0)
      errs.goodsServices = "Select at least one goods/services category.";

    const isNonTradingOrServices =
      data.goodsServices.includes("Non Trading Goods") ||
      data.goodsServices.includes("Services");
    const showDepartmentTrading =
      data.goodsServices.length > 0 && !isNonTradingOrServices;

    if (showDepartmentTrading && !data.departmentTrading) {
      errs.departmentTrading = "Select a department.";
    }

    if (!data.employeeRefName || !data.employeeRefName.trim())
      errs.employeeRefName = "Baazar Retail Employee Name is required.";
    if (!data.employeeRefContact || data.employeeRefContact.length !== 10)
      errs.employeeRefContact = "Enter a valid 10-digit employee contact number.";

    if (!data.agreeNda) errs.agreeNda = "You must agree to the NDA.";
    if (!data.agreeTerms) errs.agreeTerms = "You must agree to the terms.";
  }

  return errs;
}

export default function VendorRegistrationPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<VendorFormData>(defaultVendorFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof VendorFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [duplicateVendor, setDuplicateVendor] = useState<Vendor | null>(null);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [vrfNumber, setVrfNumber] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setData(draft.data);
      setStep(draft.step);
      setDraftRestored(true);
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const hasContent =
        step > 1 ||
        !!(data.entityName?.trim() || data.registeredEmail?.trim() || data.panNumber?.trim());
      if (hasContent) {
        saveDraft(step, data);
        setDraftRestored(true);
      }
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [step, data, draftReady]);

  const handleClearDraft = useCallback(() => {
    clearDraftStorage();
    setData(defaultVendorFormData);
    setStep(1);
    setErrors({});
    setSubmitError(null);
    setDraftRestored(false);
  }, []);

  const onChange = useCallback((updates: Partial<VendorFormData>) => {
    setData((prev) => ({ ...prev, ...updates }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(updates) as (keyof VendorFormData)[]) {
        delete next[key];
      }
      return next;
    });
  }, []);

  const handleNext = async () => {
    const stepErrors = validateStep(step, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({});
    setSubmitError(null);

    if (step === TOTAL_STEPS) {
      setSubmitting(true);
      try {
        const existing = await findDuplicateVendor({
          email: data.registeredEmail,
          panNumber: data.panNumber,
          gstin: data.gstin,
        });

        if (existing) {
          setDuplicateVendor(existing);
          setShowDuplicate(true);
          setSubmitting(false);
          return;
        }

        const created = await submitVendorRegistration({
          // Step 1
          name: data.entityName,
          entityType: data.entityType || undefined,
          address: data.registeredAddress || undefined,
          district: data.registeredDistrict || undefined,
          city: data.registeredLocation || undefined,
          zip: data.registeredPinCode || undefined,
          phone: data.registeredPhone || undefined,
          registeredPhoneAdditional: data.registeredPhoneAdditional || undefined,
          email: data.registeredEmail,
          // Step 2
          sameAsRegistered: data.sameAsRegistered,
          commAddress: data.sameAsRegistered ? undefined : data.commAddress || undefined,
          commDistrict: data.sameAsRegistered ? undefined : data.commDistrict || undefined,
          commLocation: data.sameAsRegistered ? undefined : data.commLocation || undefined,
          commPinCode: data.sameAsRegistered ? undefined : data.commPinCode || undefined,
          commPhone: data.sameAsRegistered ? undefined : data.commPhone || undefined,
          commEmail: data.sameAsRegistered ? undefined : data.commEmail || undefined,
          // Step 3
          panNumber: data.panNumber || undefined,
          panFileId: data.panFile?.storageId || undefined,
          hasTan: data.hasTan,
          tanNumber: data.hasTan ? data.tanNumber || undefined : undefined,
          tanFileId: data.hasTan ? data.tanFile?.storageId || undefined : undefined,
          gstStatus: data.gstStatus || undefined,
          gstin: data.gstin || undefined,
          gstFileId: data.gstFile?.storageId || undefined,
          gstRegistrationDate: data.gstRegistrationDate || undefined,
          placeOfBusiness: data.placeOfBusiness || undefined,
          proofOfAddressType: data.proofOfAddressType || undefined,
          proofOfAddressFileId: data.proofOfAddressFile?.storageId || undefined,
          // Step 4
          isMsmed: data.isMsmed,
          msmedType: data.isMsmed ? data.msmedType || undefined : undefined,
          msmedLineOfBusiness: data.isMsmed
            ? data.msmedLineOfBusiness || undefined
            : undefined,
          msmedFileId: data.isMsmed ? data.msmedFile?.storageId || undefined : undefined,
          bankName: data.bankName || undefined,
          accountNumber: data.bankAccountNumber || undefined,
          ifscCode: data.ifscCode || undefined,
          chequeLabel: data.chequeLabel || undefined,
          chequeFileId: data.chequeFile?.storageId || undefined,
          // Step 5
          branchName: data.branchName || undefined,
          branchAddress: data.branchAddress || undefined,
          goodsServices: data.goodsServices,
          departmentTrading:
            data.goodsServices.includes("Non Trading Goods") ||
              data.goodsServices.includes("Services")
              ? undefined
              : data.departmentTrading || undefined,
          employeeRefName: data.employeeRefName || undefined,
          employeeRefContact: data.employeeRefContact || undefined,
          vendorContactPerson: data.vendorContactPerson || undefined,
          remarks: data.remarks || undefined,
          status: "pending",
        });
        const vrf = await generateVrfNumber();
        setVrfNumber(vrf);
        if (created?.id) {
          try {
            await updateVendorVrf(created.id, vrf);
          } catch (e) {
            console.warn("Could not save VRF on vendor row:", e);
          }
        }
        clearDraftStorage();
        setDraftRestored(false);
        setShowSuccess(true);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Vendor registration error:", err.message, err);
        } else if (err && typeof err === "object") {
          console.error("Vendor registration error:", JSON.stringify(err, null, 2));
        } else {
          console.error("Vendor registration error:", err);
        }
        const msg =
          err instanceof Error
            ? err.message
            : err && typeof err === "object" && "message" in err
              ? String((err as { message: string }).message)
              : "Failed to submit. Please try again.";
        setSubmitError(msg || "Failed to submit. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => {
    setErrors({});
    setSubmitError(null);
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setVrfNumber(null);
    setData(defaultVendorFormData);
    setStep(1);
    setErrors({});
    clearDraftStorage();
    setDraftRestored(false);
  };

  return (
    <>
      <GradientBackground />
      <Navbar />
      <main className="min-h-screen relative px-4 pt-24 pb-10">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-slate-900">Vendor Registration</h1>
            <p className="mt-2 text-slate-600">
              Complete all {TOTAL_STEPS} steps to submit your application.
            </p>
            {draftRestored && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  <path d="M10 9H8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                </svg>
                <span>Draft saved — progress restored</span>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="ml-1 font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
                >
                  Clear
                </button>
              </div>
            )}
            {!draftRestored && draftReady && (
              <p className="mt-2 text-xs text-slate-400">
                Your progress is saved automatically as you fill the form.
              </p>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-500">
                Step {step} of {TOTAL_STEPS}
              </span>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {STEP_LABELS[step - 1]}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ background: "#FF6B00", width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between">
              {STEP_LABELS.map((label, i) => (
                <span
                  key={label}
                  className={`hidden text-[10px] font-medium sm:block ${i + 1 <= step ? "text-indigo-600" : "text-slate-400"
                    }`}
                >
                  {label.split(" ")[0]}
                </span>
              ))}
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
              <p className="font-semibold">
                {Object.keys(errors).length} field(s) need attention
              </p>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-rose-700">
                {Object.values(errors).map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-3xl bg-white p-6 shadow-xl sm:p-8">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {step === 1 && <Step1 data={data} onChange={onChange} errors={errors} />}
              {step === 2 && <Step2 data={data} onChange={onChange} errors={errors} />}
              {step === 3 && <Step3 data={data} onChange={onChange} errors={errors} />}
              {step === 4 && <Step4 data={data} onChange={onChange} errors={errors} />}
              {step === 5 && <Step5 data={data} onChange={onChange} errors={errors} />}
            </motion.div>

            {submitError && (
              <p className="mt-4 text-sm text-rose-600">{submitError}</p>
            )}
          </div>

          <div className="flex items-center justify-between pb-8">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 1}
              className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-slate-900 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="rounded-3xl px-6 py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
              style={{ background: "#FF6B00" }}
            >
              {submitting
                ? "Submitting…"
                : step === TOTAL_STEPS
                  ? "Submit Application"
                  : "Next Step"}
            </button>
          </div>
        </div>

        <SuccessModal open={showSuccess} onClose={handleSuccessClose} vrfNumber={vrfNumber} />
        <DuplicateWarningModal
          open={showDuplicate}
          onClose={() => setShowDuplicate(false)}
          existingVendor={duplicateVendor}
        />
      </main>
    </>
  );
}