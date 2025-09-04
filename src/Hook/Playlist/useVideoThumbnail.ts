import { useEffect, useRef, useState } from "react";

const cache = new Map<string, string>(); // url -> dataURL

/**
 * Generate a poster image from a <video> at a certain time.
 * - Works reliably for File blob URLs.
 * - For remote URLs, the server must allow CORS (Access-Control-Allow-Origin).
 */
export function useVideoThumbnail(
  src?: string,
  timeSec: number = 1
) {
  const [thumb, setThumb] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const revokeRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setThumb(null);
    setError(null);

    if (!src) return;

    // Cache hit
    if (cache.has(src)) {
      setThumb(cache.get(src)!);
      return;
    }

    const video = document.createElement("video");
    // CORS: needed for drawing remote frames to canvas
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.src = src;

    const onLoadedMetadata = () => {
      // clamp time to duration
      const t = Math.min(Math.max(timeSec, 0.1), (video.duration || 1) - 0.1);
      // seek to target frame
      video.currentTime = isFinite(t) ? t : 0.1;
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D not supported");
        ctx.drawImage(video, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        cache.set(src, dataUrl);
        if (!cancelled) setThumb(dataUrl);
      } catch (e: any) {
        // Likely a CORS taint error
        if (!cancelled) setError(e?.message || "Failed to capture thumbnail");
      } finally {
        // cleanup
        video.src = "";
        video.remove();
      }
    };

    const onError = () => {
      if (!cancelled) setError("Failed to load video");
      video.remove();
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });

    // Safari sometimes needs play/pause to decode frames (no sound)
    // void video.play().then(() => video.pause()).catch(() => {});

    return () => {
      cancelled = true;
      try {
        video.src = "";
        video.load?.();
      } catch {}
      video.remove();
      if (revokeRef.current) {
        URL.revokeObjectURL(revokeRef.current);
        revokeRef.current = null;
      }
    };
  }, [src, timeSec]);

  return { thumb, error };
}

/**
 * Helper to turn a File into an object URL you can pass to the hook.
 * Remember to revoke the URL when you're done if you create it outside React.
 */
export function fileToObjectURL(file: File) {
  return URL.createObjectURL(file);
}
