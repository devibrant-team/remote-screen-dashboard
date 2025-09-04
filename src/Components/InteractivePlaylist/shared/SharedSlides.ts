// src/components/Playlist/Interactive/SharedSlides.ts

/** Unified slide item, works for both uploads and library picks. */
export type SlideItem = {
  /** Where it came from */
  source: "library" | "upload";
  /** Preview/remote URL */
  url: string;
  /** Only images are supported for this flow */
  type: "image";
  /** Present when selected from the media library */
  mediaId?: number;
  /** Present when added via upload */
  file?: File;
};
