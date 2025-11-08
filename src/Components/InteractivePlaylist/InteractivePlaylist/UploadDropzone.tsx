// UploadDropzone.tsx
import React from "react";
import { ACCEPT_IMAGES } from "../shared/useSharedSlides";

type Props = {
  onFiles: (files: File[]) => void;
  caption: string;
  /** Current number of slides already added */
  currentSlidesCount?: number;
  /** Hard cap for slides in this layout (if any) */
  maxSelectable?: number;
  /** Optional hook to close parent UI after upload (unused here, but allowed) */
  onCloseAll?: () => void;
};

export default function UploadDropzone({
  onFiles,
  caption,
  currentSlidesCount,
  maxSelectable,
  onCloseAll, // not used now, but allowed to be passed
}: Props) {
  const capActive =
    typeof maxSelectable === "number" && Number.isFinite(maxSelectable);
  const current = currentSlidesCount ?? 0;
  const remaining = capActive ? Math.max(0, maxSelectable! - current) : undefined;
  const disabled = capActive ? remaining === 0 : false;

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const files = Array.from(e.target.files || []);
    if (files.length) onFiles(files);
    e.currentTarget.value = "";
  };

  return (
    <div
      className={[
        "border-2 border-dashed rounded-xl p-6 sm:p-8 text-center",
        disabled
          ? "border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed"
          : "border-slate-300 hover:bg-slate-50",
      ].join(" ")}
      title={disabled ? "Slide limit reached for this layout" : undefined}
    >
      <input
        id="imageUpload"
        type="file"
        accept={ACCEPT_IMAGES}
        multiple
        className="hidden"
        onChange={onChange}
        disabled={disabled}
      />
      <label
        htmlFor="imageUpload"
        className={[
          "inline-flex flex-col items-center",
          disabled ? "pointer-events-none select-none" : "cursor-pointer",
        ].join(" ")}
      >
        <div className="h-12 w-12 rounded-full bg-slate-100 ring-1 ring-slate-200 grid place-items-center mb-3">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <p className="text-sm font-medium">
          {disabled ? "Slide limit reached" : "Drag & drop or click to upload"}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {caption}
          {capActive && (
            <>
              {" • "}
              {remaining} remaining
            </>
          )}
        </p>
      </label>
    </div>
  );
}
