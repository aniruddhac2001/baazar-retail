import { supabase } from "./client";

/** Bucket for vendor registration PDFs. Create this in Supabase Dashboard → Storage. */
export const VENDOR_DOCS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "vendor-documents";

export type UploadProgressCallback = (percent: number) => void;

export type UploadResult = {
  /** Path inside the bucket (use as storageId in the form). */
  storageId: string;
  fileName: string;
  path: string;
  publicUrl: string | null;
};

/**
 * Upload a file to Supabase Storage with XHR progress events.
 * Requires a public or authenticated policy on the bucket for uploads.
 */
export async function uploadVendorDocument(
  file: File,
  folder: string = "uploads",
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = safeName.includes(".")
    ? safeName.slice(safeName.lastIndexOf("."))
    : ".pdf";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}${ext}`;

  // Prefer signed upload URL so we can track progress with XHR
  const { data: signed, error: signError } = await supabase.storage
    .from(VENDOR_DOCS_BUCKET)
    .createSignedUploadUrl(path);

  if (signError || !signed?.signedUrl) {
    // Fallback: direct upload without granular progress
    onProgress?.(10);
    const { error: uploadError } = await supabase.storage
      .from(VENDOR_DOCS_BUCKET)
      .upload(path, file, {
        contentType: file.type || "application/pdf",
        upsert: false,
      });
    if (uploadError) throw uploadError;
    onProgress?.(100);
  } else {
    await uploadWithProgress(signed.signedUrl, file, onProgress);
  }

  const { data: urlData } = supabase.storage
    .from(VENDOR_DOCS_BUCKET)
    .getPublicUrl(path);

  return {
    storageId: path,
    fileName: file.name,
    path,
    publicUrl: urlData?.publicUrl ?? null,
  };
}

function uploadWithProgress(
  signedUrl: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/pdf");

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(
          new Error(`Upload failed (${xhr.status}): ${xhr.responseText || xhr.statusText}`)
        );
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload aborted"));
    xhr.send(file);
  });
}

/** Remove a file from the vendor documents bucket by path/storageId. */
export async function removeVendorDocument(storageId: string): Promise<void> {
  if (!storageId || storageId.startsWith("local-")) return;
  const { error } = await supabase.storage
    .from(VENDOR_DOCS_BUCKET)
    .remove([storageId]);
  if (error) throw error;
}

/** Get a time-limited signed download URL for a private object. */
export async function getVendorDocumentUrl(
  storageId: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!storageId || storageId.startsWith("local-")) return null;
  const { data, error } = await supabase.storage
    .from(VENDOR_DOCS_BUCKET)
    .createSignedUrl(storageId, expiresInSeconds);
  if (error) return null;
  return data.signedUrl;
}
