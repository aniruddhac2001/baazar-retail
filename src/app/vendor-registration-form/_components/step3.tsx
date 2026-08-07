"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "motion/react";
import type { VendorFormData } from "../_lib/types";
import { GST_STATUSES, ADDRESS_PROOF_TYPES } from "../_lib/types";
import { formatPan, formatTan, formatGstin } from "../_lib/formatters";
import { FileUploadField } from "./file-upload-field";

type Props = {
  data: VendorFormData;
  onChange: (updates: Partial<VendorFormData>) => void;
  errors: Partial<Record<keyof VendorFormData, string>>;
};

export function Step3({ data, onChange, errors }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Tax &amp; Statutory Details
        </h2>
        <p className="text-sm text-muted-foreground">
          PAN, GST, and other tax registration details.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>
            PAN Number <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="AAAAA0000A"
            value={data.panNumber}
            onChange={(e) => onChange({ panNumber: formatPan(e.target.value) })}
            maxLength={10}
            className="uppercase font-mono tracking-widest"
          />
          {errors.panNumber && (
            <p className="text-xs text-destructive">{errors.panNumber}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Upload PAN Certificate (PDF)</Label>
          <FileUploadField
            label="Upload PAN PDF"
            folder="pan"
            storageId={data.panFile?.storageId ?? null}
            fileName={data.panFile?.fileName ?? null}
            onUploadComplete={(storageId, fileName) =>
              onChange({ panFile: { storageId, fileName } })
            }
            onRemove={() => onChange({ panFile: null })}
          />
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div>
              <p className="text-sm font-medium">Do you have a TAN Number?</p>
            </div>
            <Switch
              checked={data.hasTan}
              onCheckedChange={(v) => onChange({ hasTan: v })}
            />
          </div>
        </div>

        <AnimatePresence>
          {data.hasTan && (
            <motion.div
              key="tan"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="sm:col-span-2 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>TAN Number</Label>
                  <Input
                    placeholder="AAAA00000A"
                    value={data.tanNumber}
                    onChange={(e) =>
                      onChange({ tanNumber: formatTan(e.target.value) })
                    }
                    maxLength={10}
                    className="uppercase font-mono tracking-widest"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Upload TAN Certificate (PDF)</Label>
                  <FileUploadField
                    label="Upload TAN PDF"
                    folder="tan"
                    storageId={data.tanFile?.storageId ?? null}
                    fileName={data.tanFile?.fileName ?? null}
                    onUploadComplete={(storageId, fileName) =>
                      onChange({ tanFile: { storageId, fileName } })
                    }
                    onRemove={() => onChange({ tanFile: null })}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1.5">
          <Label>
            GST Registration Status <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.gstStatus}
            onValueChange={(v) => {
              // Unregistered → clear GST-related fields
              if (v === "Unregistered") {
                onChange({
                  gstStatus: v,
                  gstin: "",
                  gstFile: null,
                  gstRegistrationDate: "",
                });
              } else {
                onChange({ gstStatus: v });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select GST status" />
            </SelectTrigger>
            <SelectContent>
              {GST_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.gstStatus && (
            <p className="text-xs text-destructive">{errors.gstStatus}</p>
          )}
        </div>

        <AnimatePresence>
          {data.gstStatus && data.gstStatus !== "Unregistered" && (
            <motion.div
              key="gst-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="sm:col-span-2 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>
                    GSTIN <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="22AAAAA0000A1Z5"
                    value={data.gstin}
                    onChange={(e) =>
                      onChange({ gstin: formatGstin(e.target.value) })
                    }
                    maxLength={15}
                    className="uppercase font-mono tracking-widest"
                  />
                  {errors.gstin && (
                    <p className="text-xs text-destructive">{errors.gstin}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Upload GST Certificate (PDF)</Label>
                  <FileUploadField
                    label="Upload GST Certificate PDF"
                    folder="gst"
                    storageId={data.gstFile?.storageId ?? null}
                    fileName={data.gstFile?.fileName ?? null}
                    onUploadComplete={(storageId, fileName) =>
                      onChange({ gstFile: { storageId, fileName } })
                    }
                    onRemove={() => onChange({ gstFile: null })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>GST Registration Date</Label>
                  <Input
                    type="date"
                    value={data.gstRegistrationDate}
                    onChange={(e) =>
                      onChange({ gstRegistrationDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="sm:col-span-2 space-y-1.5">
          <Label>Place of Business</Label>
          <Input
            placeholder="Principal place of business"
            value={data.placeOfBusiness}
            onChange={(e) => onChange({ placeOfBusiness: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Proof of Address Type</Label>
          <Select
            value={data.proofOfAddressType}
            onValueChange={(v) => onChange({ proofOfAddressType: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select proof type" />
            </SelectTrigger>
            <SelectContent>
              {ADDRESS_PROOF_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Upload Address Proof (PDF)</Label>
          <FileUploadField
            label="Upload Address Proof PDF"
            folder="address-proof"
            storageId={data.proofOfAddressFile?.storageId ?? null}
            fileName={data.proofOfAddressFile?.fileName ?? null}
            onUploadComplete={(storageId, fileName) =>
              onChange({ proofOfAddressFile: { storageId, fileName } })
            }
            onRemove={() => onChange({ proofOfAddressFile: null })}
          />
        </div>
      </div>
    </div>
  );
}