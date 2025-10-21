// AllowedUploadExt.ts

export const ALLOWED_EXT = new Set([
  "jpeg",
  "jpg",
  "png",
  "gif",
  "webp",
  "mp4",
  "mov",
  "avi",
  "pdf", 
]);

export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime", 
  "video/avi",        
  "video/x-msvideo", 
  "application/pdf", 
]);


export const ACCEPT_ATTR =
  ".jpeg,.jpg,.png,.gif,.webp,.mp4,.mov,.avi,.pdf";

export function isAllowed(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const typeOk =
    ALLOWED_MIME.has(file.type) ||
    (ext === "avi" && !file.type);
  const extOk = ALLOWED_EXT.has(ext);
  return typeOk && extOk;
}

export function filterDisallowed(files: File[]) {
  const good: File[] = [];
  const bad: File[] = [];
  for (const f of files) (isAllowed(f) ? good : bad).push(f);
  return { good, bad };
}
