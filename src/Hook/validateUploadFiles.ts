// src/utils/upload/validateUploadFiles.ts
export type UploadValidationRule = {
  // max video resolution you allow (ex: 1920x1080 blocks 4K)
  maxVideoWidth?: number;
  maxVideoHeight?: number;

  // optional: if true, block videos if we can't read metadata
  blockOnVideoMetaFail?: boolean;
};

export type BlockedFile = {
  file: File;
  reason: string;
};

export async function getVideoResolution(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    return await new Promise((resolve, reject) => {
      const cleanup = () => {
        video.removeAttribute("src");
        video.load();
      };

      video.onloadedmetadata = () => {
        resolve({ width: video.videoWidth || 0, height: video.videoHeight || 0 });
        cleanup();
      };

      video.onerror = () => {
        cleanup();
        reject(new Error(`Could not read video metadata: ${file.name}`));
      };

      video.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function isVideo(file: File) {
  return file.type.startsWith("video/");
}

function isAboveMaxResolution(
  w: number,
  h: number,
  maxW: number,
  maxH: number
) {
  // handle portrait videos as well
  const landscapeOk = w <= maxW && h <= maxH;
  const portraitOk = h <= maxW && w <= maxH;
  return !(landscapeOk || portraitOk);
}

export async function validateFilesForUpload(
  files: File[],
  rules: UploadValidationRule
): Promise<{
  allowed: File[];
  blocked: BlockedFile[];
}> {
  const allowed: File[] = [];
  const blocked: BlockedFile[] = [];

  const maxW = rules.maxVideoWidth ?? 1920;
  const maxH = rules.maxVideoHeight ?? 1080;
  const blockOnMetaFail = rules.blockOnVideoMetaFail ?? true;

  for (const f of files) {
    if (!isVideo(f) || (!rules.maxVideoWidth && !rules.maxVideoHeight)) {
      allowed.push(f);
      continue;
    }

    try {
      const { width, height } = await getVideoResolution(f);

      if (isAboveMaxResolution(width, height, maxW, maxH)) {
        blocked.push({
          file: f,
          reason: `Video resolution too high (${width}×${height}). Max allowed is ${maxW}×${maxH}.`,
        });
        continue;
      }

      allowed.push(f);
    } catch (err) {
      if (blockOnMetaFail) {
        blocked.push({
          file: f,
          reason: "Unable to read video resolution metadata.",
        });
      } else {
        allowed.push(f);
      }
    }
  }

  return { allowed, blocked };
}
