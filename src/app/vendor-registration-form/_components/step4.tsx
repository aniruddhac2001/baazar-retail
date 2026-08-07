"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import { UploadIcon } from "lucide-react";
import type { VendorFormData, UploadedFileRef } from "../_lib/types";
import { MSMED_TYPES } from "../_lib/types";
import { formatIfsc } from "../_lib/formatters";
import { uploadVendorDocument } from "@/lib/supabase/storage";

type Props = {
  data: VendorFormData;
  onChange: (updates: Partial<VendorFormData>) => void;
  errors: Partial<Record<keyof VendorFormData, string>>;
};

function FileUploadButton({
  label,
  file,
  folder,
  onFile,
}: {
  label: string;
  file: UploadedFileRef;
  folder: string;
  onFile: (ref: NonNullable<UploadedFileRef>) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const result = await uploadVendorDocument(f, folder, setProgress);
      onFile({ storageId: result.storageId, fileName: result.fileName });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (file?.fileName && !uploading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
        <span className="truncate font-medium text-slate-800">{file.fileName}</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <input
        ref={ref}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="gap-2"
        disabled={uploading}
        onClick={() => ref.current?.click()}
      >
        <UploadIcon className="w-4 h-4" />
        {uploading ? `Uploading… ${progress}%` : label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function Step4({ data, onChange, errors }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          MSMED &amp; Banking Compliance
        </h2>
        <p className="text-sm text-muted-foreground">
          MSME registration and bank account details.
        </p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
        <div>
          <p className="text-sm font-medium">Are you MSMED Registered?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Micro, Small and Medium Enterprises Development
          </p>
        </div>
        <Switch
          checked={data.isMsmed}
          onCheckedChange={(v) => onChange({ isMsmed: v })}
        />
      </div>

      <AnimatePresence>
        {data.isMsmed && (
          <motion.div
            key="msmed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Line of Business</Label>
                <Input
                  placeholder="Primary line of business"
                  value={data.msmedLineOfBusiness}
                  onChange={(e) =>
                    onChange({ msmedLineOfBusiness: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>MSMED Type</Label>
                <Select
                  value={data.msmedType}
                  onValueChange={(v) => onChange({ msmedType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MSMED_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Upload MSMED Certificate PDF</Label>
                <FileUploadButton
                  label="Upload MSMED PDF"
                  file={data.msmedFile}
                  folder="msmed"
                  onFile={(f) => onChange({ msmedFile: f })}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-2 border-t">
        <p className="text-sm font-semibold text-foreground mb-4">
          Banking Details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>
              Bank Name <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Bank name"
              value={data.bankName}
              onChange={(e) => onChange({ bankName: e.target.value })}
            />
            {errors.bankName && (
              <p className="text-xs text-destructive">{errors.bankName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>
              Bank Account Number <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Account number"
              value={data.bankAccountNumber}
              onChange={(e) =>
                onChange({
                  bankAccountNumber: e.target.value.replace(/\D/g, ""),
                })
              }
              inputMode="numeric"
            />
            {errors.bankAccountNumber && (
              <p className="text-xs text-destructive">
                {errors.bankAccountNumber}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>
              IFSC Code <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="SBIN0000123"
              value={data.ifscCode}
              onChange={(e) =>
                onChange({ ifscCode: formatIfsc(e.target.value) })
              }
              maxLength={11}
              className="uppercase font-mono tracking-widest"
            />
            {errors.ifscCode && (
              <p className="text-xs text-destructive">{errors.ifscCode}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>
              Cheque Label (Name on Cheque){" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Account holder name as on cheque"
              value={data.chequeLabel}
              onChange={(e) => onChange({ chequeLabel: e.target.value })}
            />
            {errors.chequeLabel && (
              <p className="text-xs text-destructive">{errors.chequeLabel}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Upload Cancelled Cheque PDF</Label>
            <FileUploadButton
              label="Upload Cancelled Cheque PDF"
              file={data.chequeFile}
              folder="cheque"
              onFile={(f) => onChange({ chequeFile: f })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
