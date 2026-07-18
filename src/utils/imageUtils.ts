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
 * Compress an image file and return a full data URL (data:image/jpeg;base64,...).
 * This can be stored directly in any text or bytea column and rendered as an img src.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  const compressed = await compressImage(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(compressed);
  });
}

/**
 * Convert a data URL (data:image/jpeg;base64,...) into a Uint8Array.
 * Supabase JS client correctly serializes Uint8Arrays as PostgreSQL bytea.
 * Use this when writing to a bytea column (e.g. candidates.image).
 */
export function encodeByteaForSupabase(raw: string): Uint8Array {
  // Case 1: PostgreSQL bytea hex string e.g. "\x89504e47..."
  if (raw.startsWith("\\x")) {
    const hex = raw.slice(2);
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
  }

  // Case 2: data URL e.g. "data:image/jpeg;base64,/9j/..."
  const base64 = raw.includes(",") ? raw.split(",")[1] : raw;

  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    // If atob fails, return empty array (graceful fallback)
    return new Uint8Array(0);
  }
}


/**
 * Resize and compress an image file to a maximum dimension client-side.
 * Resolves with a resized Blob. If it's not an image or fails, resolves with original file.
 */
export function compressImage(file: File, maxDim = 160): Promise<Blob | File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(blob || file);
        },
        "image/jpeg",
        0.82
      );
    };
    img.onerror = () => resolve(file);
  });
}

/**
 * Convert a File object to a PostgreSQL bytea hex string (starting with \x),
 * compressing it first if it's an image to prevent UI lag and reduce DB size.
 */
export async function fileToByteaHex(file: File): Promise<string> {
  const compressed = await compressImage(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arr = new Uint8Array(reader.result as ArrayBuffer);
      const len = arr.length;
      const hexParts = new Array(len);
      for (let i = 0; i < len; i++) {
        const h = arr[i].toString(16);
        hexParts[i] = h.length === 1 ? "0" + h : h;
      }
      resolve("\\x" + hexParts.join(""));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(compressed);
  });
}


/**
 * Detect MIME type from the first few bytes of binary data.
 * Falls back to image/jpeg.
 */
function detectMimeType(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return "image/gif";
  if (bytes[0] === 0x52 && bytes[1] === 0x49) return "image/webp";
  return "image/jpeg";
}

/**
 * Convert a PostgreSQL bytea hex string (e.g. "\xffd8ff...") to a displayable
 * data URL. The hex digits are decoded to bytes, MIME type is auto-detected,
 * and the result is returned as a base64 data URL.
 */
export function byteaHexToImageUrl(hex: string): string | null {
  try {
    // Remove the leading \x prefix that Supabase/Postgres adds for bytea columns
    const clean = hex.startsWith("\\x") ? hex.slice(2) : hex;
    if (!clean || clean.length % 2 !== 0) return null;

    const pairs = clean.match(/.{1,2}/g);
    if (!pairs) return null;

    const bytes = new Uint8Array(pairs.map((b) => parseInt(b, 16)));

    // Case 1: The bytea column actually contains a TEXT string (data URL or base64)
    // that was stored as raw bytes. Decode as UTF-8 and check.
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (text.startsWith("data:")) return text;           // stored data URL
      if (text.startsWith("http")) return text;            // stored https URL
      // Raw base64 (no prefix) — wrap it
      if (/^[A-Za-z0-9+/]+=*$/.test(text.slice(0, 8))) {
        return `data:image/jpeg;base64,${text}`;
      }
    } catch {
      // Not valid UTF-8 text → treat as raw image bytes below
    }

    // Case 2: The bytea column contains actual raw image bytes (JPEG, PNG, etc.)
    const mime = detectMimeType(bytes);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    const b64 = btoa(binary);
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}


/**
 * Reconstruct a displayable image URL from any storage format used in the DB.
 * Handles four cases in order:
 *  1. Null/empty → returns null
 *  2. Full data URL  (data:image/...)    → returned as-is
 *  3. HTTP/HTTPS URL                    → returned as-is
 *  4. PostgreSQL bytea hex  (\xffd8...) → decoded via byteaHexToImageUrl()
 *  5. Raw base64 string                 → wrapped with a JPEG data URL prefix
 */
export function base64ToImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("data:")) return raw;
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("\\x")) return byteaHexToImageUrl(raw);
  // Fallback: treat as raw base64
  return `data:image/jpeg;base64,${raw}`;
}

/**
 * Generate a local initials avatar as a data URL using Canvas.
 * No network requests — works in any origin including localhost.
 * Returns a base64 PNG data URL.
 */
export function generateInitialsAvatar(name: string, size = 128): string {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const colors = [
    ["#1e3a8a", "#93c5fd"],
    ["#166534", "#86efac"],
    ["#7c2d12", "#fca5a5"],
    ["#4c1d95", "#c4b5fd"],
    ["#0c4a6e", "#7dd3fc"],
    ["#3b0764", "#e879f9"],
    ["#1c1917", "#d6d3d1"],
  ];
  const idx =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  const [bg, fg] = colors[idx];

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Background circle
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Initials text
  ctx.fillStyle = fg;
  ctx.font = `bold ${Math.round(size * 0.38)}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, size / 2, size / 2 + 1);

  return canvas.toDataURL("image/png");
}


