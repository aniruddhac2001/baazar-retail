"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  UploadIcon,
  FileTextIcon,
  CheckCircle2Icon,
  XIcon,
  Loader2Icon,
} from "lucide-react";
import { motion } from "motion/react";
import {
  uploadVendorDocument,
  removeVendorDocument,
} from "@/lib/supabase/storage";

type UploadState = "idle" | "uploading" | "done" | "error";

type Props = {
  label: string;
  storageId: string | null;
  fileName: string | null;
  /** Optional folder prefix inside the bucket (e.g. "pan", "gst"). */
  folder?: string;
  onUploadComplete: (storageId: string, fileName: string) => void;
  onRemove: () => void;
};

export function FileUploadField({
  label,
  storageId,
  fileName,
  folder = "uploads",
  onUploadComplete,
  onRemove,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setUploadState("error");
      setErrorMessage("Only PDF files are allowed.");
      return;
    }

    // Optional size limit: 10 MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadState("error");
      setErrorMessage("File must be 10 MB or smaller.");
      return;
    }

    setUploadState("uploading");
    setProgress(0);
    setErrorMessage(null);

    try {
      const result = await uploadVendorDocument(file, folder, (pct) => {
        setProgress(pct);
      });
      setProgress(100);
      setUploadState("done");
      onUploadComplete(result.storageId, result.fileName);
    } catch (err) {
      console.error("Supabase upload error:", err);
      setUploadState("error");
      setProgress(0);
      setErrorMessage(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    }
  };

  const handleRemove = async () => {
    const id = storageId;
    setUploadState("idle");
    setProgress(0);
    setErrorMessage(null);
    if (ref.current) ref.current.value = "";
    onRemove();
    if (id) {
      try {
        await removeVendorDocument(id);
      } catch (err) {
        console.warn("Could not delete remote file:", err);
      }
    }
  };

  // Already uploaded
  if (storageId && fileName && uploadState !== "uploading") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border"
        style={{
          background: "rgba(34,197,94,0.06)",
          borderColor: "rgba(34,197,94,0.25)",
        }}
      >
        <CheckCircle2Icon className="w-4 h-4 text-green-600 shrink-0" />
        <FileTextIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-foreground flex-1 truncate">
          {fileName}
        </span>
        <button
          type="button"
          onClick={handleRemove}
          className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          title="Remove file"
        >
          <XIcon className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    );
  }

  // Uploading
  if (uploadState === "uploading") {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30">
          <Loader2Icon className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground flex-1">
            Uploading… {progress}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #FF6B00, #FF9A3C)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
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
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="gap-2 w-full justify-start"
        onClick={() => ref.current?.click()}
      >
        <UploadIcon className="w-4 h-4 shrink-0" />
        <span className="truncate">{label}</span>
      </Button>
      {uploadState === "error" && (
        <p className="text-xs text-destructive">
          {errorMessage || "Upload failed. Please try again."}
        </p>
      )}
    </div>
  );
}

export type UploadedFile = { storageId: string; fileName: string } | null;
