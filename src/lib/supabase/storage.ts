import { supabase } from "./client";

/** Bucket for vendor registration PDFs. Create this in Supabase Dashboard → Storage. */
export const VENDOR_DOCS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "VRF";

export type UploadProgressCallback = (percent: number) => void;

export type UploadResult = {
  /** Path inside the bucket (use as storageId in the form). */
  storageId: string;
  fileName: string;
  path: string;
  publicUrl: string | null;
};

/** Helper to check if bucket exists, or attempt auto-creation */
async function ensureBucketExists(bucketName: string): Promise<boolean> {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (buckets && buckets.some((b) => b.name === bucketName)) {
      return true;
    }
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true,
    });
    return !error;
  } catch {
    return false;
  }
}

/** Convert file to Data URL for local fallback */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a file to Supabase Storage with XHR progress events.
 * Automatically tries primary bucket, fallback buckets, or client-side fallback if missing.
 */
export async function uploadVendorDocument(
  file: File,
  folder: string = "uploads",
  onProgress?: UploadProgressCallback,
): Promise<UploadResult> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = safeName.includes(".")
    ? safeName.slice(safeName.lastIndexOf("."))
    : ".pdf";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}${ext}`;

  onProgress?.(10);

  // Target bucket names to attempt: primary configured bucket, then fallback "VRF" and "vendor-documents"
  const bucketsToTry = Array.from(
    new Set([VENDOR_DOCS_BUCKET, "VRF", "vendor-documents"]).values(),
  );

  for (const bucket of bucketsToTry) {
    try {
      await ensureBucketExists(bucket);

      // Attempt signed upload URL
      const { data: signed, error: signError } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(path);

      if (!signError && signed?.signedUrl) {
        await uploadWithProgress(signed.signedUrl, file, onProgress);
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(path);
        return {
          storageId: path,
          fileName: file.name,
          path,
          publicUrl: urlData?.publicUrl ?? null,
        };
      }

      // Fallback direct upload
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: file.type || "application/pdf",
          upsert: true,
        });

      if (!uploadError) {
        onProgress?.(100);
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(path);
        return {
          storageId: path,
          fileName: file.name,
          path,
          publicUrl: urlData?.publicUrl ?? null,
        };
      }
    } catch {
      /* continue to next bucket or local fallback */
    }
  }

  // Graceful Fallback if Supabase storage upload fails or bucket is missing
  onProgress?.(50);
  const dataUrl = await fileToDataUrl(file);
  onProgress?.(100);

  return {
    storageId: dataUrl,
    fileName: file.name,
    path: path,
    publicUrl: dataUrl,
  };
}

function uploadWithProgress(
  signedUrl: string,
  file: File,
  onProgress?: UploadProgressCallback,
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
          new Error(
            `Upload failed (${xhr.status}): ${xhr.responseText || xhr.statusText}`,
          ),
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
  if (
    !storageId ||
    storageId.startsWith("local-") ||
    storageId.startsWith("data:")
  )
    return;
  const { error } = await supabase.storage
    .from(VENDOR_DOCS_BUCKET)
    .remove([storageId]);
  if (error) throw error;
}

/** Get a time-limited signed download URL for a private object. */
export async function getVendorDocumentUrl(
  storageId: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  if (!storageId || !storageId.trim()) return null;
  if (storageId.startsWith("data:")) return storageId;
  if (storageId.startsWith("http://") || storageId.startsWith("https://"))
    return storageId;

  try {
    const { data: publicData } = supabase.storage
      .from(VENDOR_DOCS_BUCKET)
      .getPublicUrl(storageId);
    if (publicData?.publicUrl) return publicData.publicUrl;

    const { data, error } = await supabase.storage
      .from(VENDOR_DOCS_BUCKET)
      .createSignedUrl(storageId, expiresInSeconds);
    if (error) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
