import { useEffect, useMemo, useState, useCallback } from "react";

export const ratioToAspectString = (r?: string) => {
  if (!r) return "16 / 9";
  const [a, b] = String(r).split(":").map(x => Number(String(x).trim()));
  return Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0 ? `${a} / ${b}` : "16 / 9";
};

export const ratioToAspectNumber = (r?: string) => {
  if (!r) return 16 / 9;
  const [a, b] = String(r).split(":").map(x => Number(String(x).trim()));
  return Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? a / b : 16 / 9;
};

type WidthOpts = {
  maxW?: number;
  sideMargin?: number;
  topBottomMargin?: number;
  minW?: number;
  fitBy?: "auto" | "height" | "width";
  /** NEW: bounds from a measured container (preferred) */
  containerW?: number;
  containerH?: number;
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
    fitBy = "auto",
    containerW,
    containerH,
  } = opts || {};

  const aspect = useMemo(() => ratioToAspectNumber(ratio), [ratio]);

  const compute = useCallback(() => {
    // Prefer container dimensions if provided
    const viewportW = containerW ?? (typeof window !== "undefined" ? window.innerWidth : 0);
    const viewportH = containerH ?? (typeof window !== "undefined" ? window.innerHeight : 0);

    if (!viewportW && !viewportH) return Math.min(maxW, 600); // SSR fallback

    const availW = Math.max(minW, viewportW - sideMargin);
    const availH = Math.max(minW, viewportH - topBottomMargin);

    const widthFromWidth  = availW;
    const widthFromHeight = availH * aspect;
    const maxCap = Number.isFinite(maxW) ? maxW : Number.POSITIVE_INFINITY;

    let w: number;
    if (fitBy === "height") {
      w = Math.min(maxCap, widthFromHeight);
    } else if (fitBy === "width") {
      w = Math.min(maxCap, widthFromWidth);
    } else {
      w = Math.min(maxCap, widthFromWidth, widthFromHeight);
    }

    return Math.max(minW, w);
  }, [aspect, fitBy, maxW, minW, sideMargin, topBottomMargin, containerW, containerH]);

  const [w, setW] = useState<number>(() => compute());

  useEffect(() => {
    setW(compute());
  }, [compute]);

  return w;
}

export function useAspectStyle(
  ratio: string | undefined,
  opts?: WidthOpts
) {
  const width = useResponsivePreviewWidth(ratio, opts);
  return { width: `${width}px`, aspectRatio: ratioToAspectString(ratio) } as const;
}
