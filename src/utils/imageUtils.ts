/**
 * Convert a File object to a raw base64 string (no data URL prefix).
 * This is stored in the database as binary-encoded text.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Strip the "data:image/...;base64," prefix to get raw base64
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Reconstruct a displayable data URL from a raw base64 string stored in the database.
 * Handles three cases:
 *  1. Already a full data URL (data:image/...) — returned as-is
 *  2. Already a regular URL (http/https) — returned as-is
 *  3. Raw base64 string — wrapped with a JPEG data URL prefix
 */
export function base64ToImageUrl(base64OrUrl: string | null | undefined): string | null {
  if (!base64OrUrl) return null;
  if (base64OrUrl.startsWith("data:")) return base64OrUrl;
  if (base64OrUrl.startsWith("http")) return base64OrUrl;
  return `data:image/jpeg;base64,${base64OrUrl}`;
}
