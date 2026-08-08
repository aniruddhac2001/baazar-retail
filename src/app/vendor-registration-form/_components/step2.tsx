"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "motion/react";
import type { VendorFormData } from "../_lib/types";
import { formatPhone, displayPhone, formatPin } from "../_lib/formatters";

type Props = {
  data: VendorFormData;
  onChange: (updates: Partial<VendorFormData>) => void;
  errors: Partial<Record<keyof VendorFormData, string>>;
};

export function Step2({ data, onChange, errors }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Communication Address
        </h2>
        <p className="text-sm text-muted-foreground">
          Where should we send communications?
        </p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
        <div>
          <p className="text-sm font-medium text-foreground">
            Same as Registered Office Address
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Toggle off to provide a separate communication address
          </p>
        </div>
        <Switch
          checked={data.sameAsRegistered}
          onCheckedChange={(v) => onChange({ sameAsRegistered: v })}
        />
      </div>

      <AnimatePresence>
        {!data.sameAsRegistered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>
                  Communication Address{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Full communication address"
                  value={data.commAddress}
                  onChange={(e) => onChange({ commAddress: e.target.value })}
                />
                {errors.commAddress && (
                  <p className="text-xs text-destructive">
                    {errors.commAddress}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>
                  District <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="District"
                  value={data.commDistrict}
                  onChange={(e) => onChange({ commDistrict: e.target.value })}
                />
                {errors.commDistrict && (
                  <p className="text-xs text-destructive">
                    {errors.commDistrict}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>
                  Location / City <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="City / Town"
                  value={data.commLocation}
                  onChange={(e) => onChange({ commLocation: e.target.value })}
                />
                {errors.commLocation && (
                  <p className="text-xs text-destructive">
                    {errors.commLocation}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>
                  PIN Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="6-digit PIN code"
                  value={data.commPinCode}
                  onChange={(e) =>
                    onChange({ commPinCode: formatPin(e.target.value) })
                  }
                  maxLength={6}
                  inputMode="numeric"
                />
                {errors.commPinCode && (
                  <p className="text-xs text-destructive">
                    {errors.commPinCode}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    +91
                  </span>
                  <Input
                    className="pl-12"
                    placeholder="XXXXX XXXXX"
                    value={displayPhone(data.commPhone)}
                    onChange={(e) =>
                      onChange({ commPhone: formatPhone(e.target.value) })
                    }
                    maxLength={10}
                    inputMode="numeric"
                  />
                </div>
                {errors.commPhone && (
                  <p className="text-xs text-destructive">{errors.commPhone}</p>
                )}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label>
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="example@company.com"
                  value={data.commEmail}
                  onChange={(e) => onChange({ commEmail: e.target.value })}
                />
                {errors.commEmail && (
                  <p className="text-xs text-destructive">{errors.commEmail}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {data.sameAsRegistered && (
        <div className="p-4 rounded-lg border-2 border-dashed border-border text-center text-sm text-muted-foreground">
          Communications will be sent to your registered office address.
        </div>
      )}
    </div>
  );
}
