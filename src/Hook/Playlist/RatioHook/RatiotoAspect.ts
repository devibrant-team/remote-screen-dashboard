import { useEffect, useMemo, useState, useCallback } from "react";

export type AspectRatio = "16:9" | "21:9" | "9:16" | "4:3" | "3:4";

export const ratioToAspectString = (r?: string) => {
  switch (r as AspectRatio) {
    case "16:9": return "16 / 9";
    case "21:9": return "21 / 9";
    case "9:16": return "9 / 16";
    case "4:3":  return "4 / 3";
    case "3:4":  return "3 / 4";
    default:     return "16 / 9";
  }
};

export const ratioToAspectNumber = (r?: string) => {
  switch (r as AspectRatio) {
    case "16:9": return 16 / 9;
    case "21:9": return 21 / 9;
    case "9:16": return 9 / 16;
    case "4:3":  return 4 / 3;
    case "3:4":  return 3 / 4;
    default:     return 16 / 9;
  }
};

type WidthOpts = {
  maxW?: number;        // hard max width in px
  sideMargin?: number;  // total left+right margin to preserve
  topBottomMargin?: number; // total top+bottom margin to preserve
  minW?: number;        // optional hard min width
};

export function useResponsivePreviewWidth(
  ratio: string | undefined,
  opts?: WidthOpts
) {
  const {
    maxW = 1200,
    sideMargin = 48,
    topBottomMargin = 220,
    minW = 320,
  } = opts || {};

  const aspect = useMemo(() => ratioToAspectNumber(ratio), [ratio]);

  const compute = useCallback(() => {
    if (typeof window === "undefined") return Math.min(maxW, 600); // SSR fallback
    const availW = Math.max(minW, window.innerWidth - sideMargin);
    const availH = Math.max(minW, window.innerHeight - topBottomMargin);
    // Fit by height for tall ratios; width for wide ratios
    return Math.min(maxW, availW, availH * aspect);
  }, [aspect, maxW, minW, sideMargin, topBottomMargin]);

  const [w, setW] = useState<number>(() => compute());

  useEffect(() => {
    const onResize = () => setW(compute());
    onResize(); // recompute on mount in case SSR fallback ran
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [compute]);

  return w;
}

/** Convenience: get a ready-to-spread style object */
export function useAspectStyle(
  ratio: string | undefined,
  opts?: WidthOpts
) {
  const width = useResponsivePreviewWidth(ratio, opts);
  return { width: `${width}px`, aspectRatio: ratioToAspectString(ratio) } as const;
}
