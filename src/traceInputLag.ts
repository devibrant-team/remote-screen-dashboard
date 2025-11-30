// src/utils/traceInputLag.ts
export function traceInputLag(label: string, thresholdMs = 30) {
  if (typeof performance === "undefined" || typeof requestAnimationFrame === "undefined") {
    return;
  }

  const start = performance.now();

  // نطلب أول frame بعد event + render
  requestAnimationFrame(() => {
    const delay = performance.now() - start;
    if (delay > thresholdMs) {
      // لو الفريم تأخر أكثر من threshold → نطبع تحذير
      // رح تشوفها في DevTools console حتى بالـ EXE
      // لو فتحت devtools
      // (Ctrl+Shift+I أو من الكود تحت)
      // 👇
      // eslint-disable-next-line no-console
      console.warn(
        `[INPUT LAG] ${label} frame delay: ${delay.toFixed(1)}ms (threshold=${thresholdMs}ms)`
      );
    }
  });
}
