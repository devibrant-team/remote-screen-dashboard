import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import type { SlideItem } from "./SharedSlides";

/** Validation: block .ico and any video-like extensions by filename/URL */
const DISALLOWED_EXT_RE = /\.(ico)$/i;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|avi|mkv|3gp)$/i;

/** Allowed upload MIME types */
const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export const ACCEPT_IMAGES = "image/jpeg,image/jpg,image/png,image/webp";

/** Caps per layout: 2 -> 4, 3 -> 5; others = no cap */
const LAYOUT_CAPS: Record<number, number> = { 2: 4, 3: 5 };
const getCapForLayout = (layoutId?: number): number | undefined =>
  typeof layoutId === "number" && layoutId in LAYOUT_CAPS
    ? LAYOUT_CAPS[layoutId]
    : undefined;

/** Upload file validation */
export function isValidImageFile(file: File) {
  const name = file.name || "";
  const extOk =
    !DISALLOWED_EXT_RE.test(name) &&
    !VIDEO_EXT_RE.test(name) &&
    /\.(jpe?g|png|webp)$/i.test(name);

  const mimeOk =
    ALLOWED_IMAGE_MIME.has(file.type) ||
    (file.type === "" && extOk); // allow extension-only case (some browsers omit MIME)

  return mimeOk && extOk;
}

/** URL/filename validation */
export function isValidImageUrl(url: string) {
  if (DISALLOWED_EXT_RE.test(url)) return false;
  if (VIDEO_EXT_RE.test(url)) return false;
  return true;
}

export function useSharedSlides() {
  const [slides, setSlides] = useState<SlideItem[]>([]);
  /** we keep created blob URLs to revoke them on unmount/replace */
  const blobUrls = useRef<string[]>([]);

  // use the actual reducer key you mounted (likely "playlistInteractive")
  const layoutId = useSelector(
    (s: RootState) => s.playlistInteractive?.playlistData?.layoutId
  );
  const cap = getCapForLayout(layoutId); // undefined = no cap
  const max = cap ?? Number.POSITIVE_INFINITY;

  // set state with cap enforcement
  type Next = SlideItem[] | ((prev: SlideItem[]) => SlideItem[]);
  const setCapped = useCallback(
    (next: Next) => {
      setSlides((prev) => {
        const computed =
          typeof next === "function" ? (next as (p: SlideItem[]) => SlideItem[])(prev) : next;
        return typeof cap === "number" ? computed.slice(0, cap) : computed;
      });
    },
    [cap]
  );

  /** Add multiple uploaded files */
  const addUploads = useCallback(
    (files: File[]) => {
      const valid = files.filter(isValidImageFile);
      const created: SlideItem[] = valid.map((file) => {
        const url = URL.createObjectURL(file);
        blobUrls.current.push(url);
        return { source: "upload", file, url, type: "image" };
      });

      setCapped((prev) => [...prev, ...created]);
    },
    [setCapped]
  );

  /** Merge current library selection; de-dupe by mediaId; drop deselected */
  const mergeLibrary = useCallback(
    (libraryItems: Array<{ id: number; url: string }>) => {
      const selectedIds = new Set(libraryItems.map((m) => m.id));

      setCapped((prev) => {
        // keep existing, but drop library items that are no longer selected
        let next = prev.filter(
          (s) => !(s.source === "library" && s.mediaId && !selectedIds.has(s.mediaId))
        );

        // add any newly selected images
        for (const m of libraryItems) {
          const canAdd =
            isValidImageUrl(m.url) &&
            !next.some((s) => s.source === "library" && s.mediaId === m.id) &&
            (typeof cap !== "number" || next.length < cap);

          if (canAdd) {
            next = [...next, { source: "library", mediaId: m.id, url: m.url, type: "image" }];
          }
        }
        return next;
      });
    },
    [setCapped, cap]
  );

  /** Replace a slide by index with a new uploaded file */
  const replaceAt = useCallback((index: number, file: File) => {
    if (!isValidImageFile(file)) return { ok: false as const };

    let removedLibraryMediaId: number | undefined;

    setSlides((prev) => {
      const next = [...prev];
      const newUrl = URL.createObjectURL(file);
      blobUrls.current.push(newUrl);

      // revoke old blob if existed
      const old = next[index];
      if (old?.source === "upload") {
        try {
          URL.revokeObjectURL(old.url);
        } catch {}
      }
      if (old?.source === "library" && old.mediaId) {
        removedLibraryMediaId = old.mediaId;
      }

      next[index] = { source: "upload", file, url: newUrl, type: "image" };
      return next;
    });

    return { ok: true as const, removedLibraryMediaId };
  }, []);

  /** Delete slide by index */
  const deleteAt = useCallback((index: number) => {
    let removedLibraryMediaId: number | undefined;

    setSlides((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.source === "upload") {
        try {
          URL.revokeObjectURL(removed.url);
        } catch {}
      }
      if (removed?.source === "library" && removed.mediaId) {
        removedLibraryMediaId = removed.mediaId;
      }
      return next;
    });

    return { removedLibraryMediaId };
  }, []);

  /** Reorder slides */
  const reorder = useCallback(
    (reordered: SlideItem[]) => {
      setCapped(reordered);
    },
    [setCapped]
  );

  /** Build FormData for create/update */
  const toFormData = useCallback(
    (opts: { name: string; styleId: number | string }) => {
      const fd = new FormData();
      fd.append("name", opts.name.trim());
      fd.append("style_id", String(opts.styleId));
      fd.append("slide_number", String(slides.length));

      slides.forEach((s, index) => {
        fd.append(`slides[${index}][index]`, String(index));
        if (s.source === "library" && s.mediaId) {
          fd.append(`slides[${index}][media_id]`, String(s.mediaId));
        } else if (s.source === "upload" && s.file) {
          fd.append(`slides[${index}][media]`, s.file);
        }
      });

      return fd;
    },
    [slides]
  );

  // cleanup all blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrls.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
      blobUrls.current = [];
    };
  }, []);

  return {
    slides,
    addUploads,
    mergeLibrary,
    replaceAt,
    deleteAt,
    reorder,
    toFormData,
    max, // Number.POSITIVE_INFINITY if no cap
    ACCEPT_IMAGES,
  };
}
