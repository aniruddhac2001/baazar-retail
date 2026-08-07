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
import type { VendorFormData } from "../_lib/types";
import { ENTITY_TYPES } from "../_lib/types";
import { formatPhone, displayPhone, formatPin } from "../_lib/formatters";

type Props = {
  data: VendorFormData;
  onChange: (updates: Partial<VendorFormData>) => void;
  errors: Partial<Record<keyof VendorFormData, string>>;
};

export function Step1({ data, onChange, errors }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Entity &amp; Contact Details
        </h2>
        <p className="text-sm text-muted-foreground">
          Basic information about your business entity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Entity Name */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label>
            Entity Name <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="Enter entity / business name"
            value={data.entityName}
            onChange={(e) => onChange({ entityName: e.target.value })}
          />
          {errors.entityName && (
            <p className="text-xs text-destructive">{errors.entityName}</p>
          )}
        </div>

        {/* Entity Type */}
        <div className="space-y-1.5">
          <Label>
            Entity Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.entityType}
            onValueChange={(v) => onChange({ entityType: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select entity type" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.entityType && (
            <p className="text-xs text-destructive">{errors.entityType}</p>
          )}
        </div>

        {/* PIN Code */}
        <div className="space-y-1.5">
          <Label>
            PIN Code <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="6-digit PIN code"
            value={data.registeredPinCode}
            onChange={(e) =>
              onChange({ registeredPinCode: formatPin(e.target.value) })
            }
            maxLength={6}
            inputMode="numeric"
          />
          {errors.registeredPinCode && (
            <p className="text-xs text-destructive">
              {errors.registeredPinCode}
            </p>
          )}
        </div>

        {/* Registered Address */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label>
            Registered Office Address{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="Full registered office address"
            value={data.registeredAddress}
            onChange={(e) => onChange({ registeredAddress: e.target.value })}
          />
          {errors.registeredAddress && (
            <p className="text-xs text-destructive">
              {errors.registeredAddress}
            </p>
          )}
        </div>

        {/* District */}
        <div className="space-y-1.5">
          <Label>
            District <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="District"
            value={data.registeredDistrict}
            onChange={(e) => onChange({ registeredDistrict: e.target.value })}
          />
          {errors.registeredDistrict && (
            <p className="text-xs text-destructive">
              {errors.registeredDistrict}
            </p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label>
            Location / City <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="City / Town"
            value={data.registeredLocation}
            onChange={(e) => onChange({ registeredLocation: e.target.value })}
          />
          {errors.registeredLocation && (
            <p className="text-xs text-destructive">
              {errors.registeredLocation}
            </p>
          )}
        </div>

        {/* Phone */}
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
              value={displayPhone(data.registeredPhone)}
              onChange={(e) =>
                onChange({ registeredPhone: formatPhone(e.target.value) })
              }
              maxLength={10}
              inputMode="numeric"
            />
          </div>
          {errors.registeredPhone && (
            <p className="text-xs text-destructive">{errors.registeredPhone}</p>
          )}
        </div>

        {/* Additional Phone */}
        <div className="space-y-1.5">
          <Label>Additional Phone Number</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              +91
            </span>
            <Input
              className="pl-12"
              placeholder="XXXXX XXXXX"
              value={displayPhone(data.registeredPhoneAdditional)}
              onChange={(e) =>
                onChange({
                  registeredPhoneAdditional: formatPhone(e.target.value),
                })
              }
              maxLength={10}
              inputMode="numeric"
            />
          </div>
        </div>

        {/* Email */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label>
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            type="email"
            placeholder="example@company.com"
            value={data.registeredEmail}
            onChange={(e) => onChange({ registeredEmail: e.target.value })}
          />
          {errors.registeredEmail && (
            <p className="text-xs text-destructive">{errors.registeredEmail}</p>
          )}
        </div>
      </div>
    </div>
  );
}
