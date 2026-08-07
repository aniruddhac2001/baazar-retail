"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import type { VendorFormData } from "../_lib/types";
import { MSMED_TYPES } from "../_lib/types";
import { formatIfsc } from "../_lib/formatters";
import { FileUploadField } from "./file-upload-field";

type Props = {
  data: VendorFormData;
  onChange: (updates: Partial<VendorFormData>) => void;
  errors: Partial<Record<keyof VendorFormData, string>>;
};

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
                <FileUploadField
                  label="Upload MSMED PDF"
                  folder="msmed"
                  storageId={data.msmedFile?.storageId ?? null}
                  fileName={data.msmedFile?.fileName ?? null}
                  onUploadComplete={(storageId, fileName) =>
                    onChange({ msmedFile: { storageId, fileName } })
                  }
                  onRemove={() => onChange({ msmedFile: null })}
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
            <FileUploadField
              label="Upload Cancelled Cheque PDF"
              folder="cheque"
              storageId={data.chequeFile?.storageId ?? null}
              fileName={data.chequeFile?.fileName ?? null}
              onUploadComplete={(storageId, fileName) =>
                onChange({ chequeFile: { storageId, fileName } })
              }
              onRemove={() => onChange({ chequeFile: null })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
