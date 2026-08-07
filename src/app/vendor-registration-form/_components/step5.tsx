"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import type { VendorFormData } from "../_lib/types";
import { GOODS_SERVICES, DEPARTMENT_TRADING } from "../_lib/types";
import { formatPhone, displayPhone } from "../_lib/formatters";

type Props = {
  data: VendorFormData;
  onChange: (updates: Partial<VendorFormData>) => void;
  errors: Partial<Record<keyof VendorFormData, string>>;
};

export function Step5({ data, onChange, errors }: Props) {
  const isNonTradingOrServices =
    data.goodsServices.includes("Non Trading Goods") ||
    data.goodsServices.includes("Services");
  const showDepartmentTrading =
    data.goodsServices.length > 0 && !isNonTradingOrServices;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Operational Details
        </h2>
        <p className="text-sm text-muted-foreground">
          Branch info, goods/services, and final declarations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Branch */}
        <div className="space-y-1.5 flex flex-col justify-end">
          <Label className="flex items-end min-h-[2.5rem] leading-tight pb-0.5">
            Branch Name <span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            placeholder="Branch name"
            value={data.branchName}
            onChange={(e) => onChange({ branchName: e.target.value })}
          />
          {errors.branchName && (
            <p className="text-xs text-destructive">{errors.branchName}</p>
          )}
        </div>

        <div className="space-y-1.5 flex flex-col justify-end">
          <Label className="flex items-end min-h-[2.5rem] leading-tight pb-0.5">
            Branch Address <span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            placeholder="Branch address"
            value={data.branchAddress}
            onChange={(e) => onChange({ branchAddress: e.target.value })}
          />
          {errors.branchAddress && (
            <p className="text-xs text-destructive">{errors.branchAddress}</p>
          )}
        </div>

        {/* Goods / Services Dropdown */}
        <div className="space-y-1.5 flex flex-col justify-end">
          <Label className="flex items-end min-h-[2.5rem] leading-tight pb-0.5">
            Goods / Services provided to Baazar Retail Limited{" "}
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Select
            value={data.goodsServices[0] || ""}
            onValueChange={(val) => {
              const isNonTrading =
                val === "Non Trading Goods" || val === "Services";
              onChange({
                goodsServices: val ? [val] : [],
                ...(isNonTrading ? { departmentTrading: "" } : {}),
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Goods / Services" />
            </SelectTrigger>
            <SelectContent>
              {GOODS_SERVICES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.goodsServices && (
            <p className="text-xs text-destructive">{errors.goodsServices}</p>
          )}
        </div>

        {/* Department Trading — visible only for Trading Goods */}
        {showDepartmentTrading && (
          <div className="space-y-1.5 flex flex-col justify-end">
            <Label className="flex items-end min-h-[2.5rem] leading-tight pb-0.5">
              Department Trading <span className="text-destructive ml-1">*</span>
            </Label>
            <Select
              value={data.departmentTrading}
              onValueChange={(v) => onChange({ departmentTrading: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENT_TRADING.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.departmentTrading && (
              <p className="text-xs text-destructive">
                {errors.departmentTrading}
              </p>
            )}
          </div>
        )}

        {/* Vendor Contact */}
        <div className="space-y-1.5 flex flex-col justify-end">
          <Label className="flex items-end min-h-[2.5rem] leading-tight pb-0.5">
            Vendor Contact Person Number
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              +91
            </span>
            <Input
              className="pl-12"
              placeholder="XXXXX XXXXX"
              value={displayPhone(data.vendorContactPerson)}
              onChange={(e) =>
                onChange({ vendorContactPerson: formatPhone(e.target.value) })
              }
              maxLength={10}
              inputMode="numeric"
            />
          </div>
        </div>

        {/* Employee Reference fields — directly displayed */}
        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 flex flex-col justify-end">
            <Label className="flex items-end min-h-[2.5rem] leading-tight pb-0.5">
              Mention Name of Baazar Retail Employee{" "}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              placeholder="Employee name"
              value={data.employeeRefName}
              onChange={(e) => onChange({ employeeRefName: e.target.value, hasBaazarReference: true })}
            />
            {errors.employeeRefName && (
              <p className="text-xs text-destructive">{errors.employeeRefName}</p>
            )}
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <Label className="flex items-end min-h-[2.5rem] leading-tight pb-0.5">
              Contact Number <span className="text-destructive ml-1">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                +91
              </span>
              <Input
                className="pl-12"
                placeholder="XXXXX XXXXX"
                value={displayPhone(data.employeeRefContact)}
                onChange={(e) =>
                  onChange({
                    employeeRefContact: formatPhone(e.target.value),
                    hasBaazarReference: true,
                  })
                }
                maxLength={10}
                inputMode="numeric"
              />
            </div>
            {errors.employeeRefContact && (
              <p className="text-xs text-destructive">
                {errors.employeeRefContact}
              </p>
            )}
          </div>
        </div>

        {/* Remarks */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Remarks</Label>
          <Textarea
            placeholder="Any additional remarks..."
            value={data.remarks}
            onChange={(e) => onChange({ remarks: e.target.value })}
            rows={3}
          />
        </div>

        {/* Agreements */}
        <div className="sm:col-span-2 space-y-5">
          {/* NDA */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              Non-Disclosure Agreement
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden max-h-72 overflow-y-auto p-2">
              <Image
                src="/Non.png"
                alt="Non-Disclosure Agreement"
                width={800}
                height={1100}
                className="w-full h-auto object-contain"
                unoptimized
              />
            </div>
            <div className="flex items-start gap-3 pt-1">
              <Checkbox
                id="nda"
                checked={data.agreeNda}
                onCheckedChange={(v) => onChange({ agreeNda: Boolean(v) })}
              />
              <label
                htmlFor="nda"
                className="text-sm cursor-pointer leading-relaxed"
              >
                I agree to the{" "}
                <span className="font-semibold">
                  Non-Disclosure Agreement Clause
                </span>{" "}
                as specified by Baazar Retail Private Limited.
              </label>
            </div>
            {errors.agreeNda && (
              <p className="text-xs text-destructive">{errors.agreeNda}</p>
            )}
          </div>

          {/* Standard Terms */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              Standard Terms of Business
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden max-h-72 overflow-y-auto p-2">
              <Image
                src="/Standard.jpg"
                alt="Standard Terms of Business"
                width={900}
                height={600}
                className="w-full h-auto object-contain"
                unoptimized
              />
            </div>
            <div className="flex items-start gap-3 pt-1">
              <Checkbox
                id="terms"
                checked={data.agreeTerms}
                onCheckedChange={(v) => onChange({ agreeTerms: Boolean(v) })}
              />
              <label
                htmlFor="terms"
                className="text-sm cursor-pointer leading-relaxed"
              >
                I agree to the{" "}
                <span className="font-semibold">Standard Terms of Business</span>{" "}
                as specified by Baazar Retail Private Limited.
              </label>
            </div>
            {errors.agreeTerms && (
              <p className="text-xs text-destructive">{errors.agreeTerms}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}