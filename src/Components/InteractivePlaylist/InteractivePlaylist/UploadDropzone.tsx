import React from "react";
import { ACCEPT_IMAGES } from "../shared/useSharedSlides";

export default function UploadDropzone({
  onFiles,
  caption,
}: { onFiles: (files: File[]) => void; caption: string }) {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onFiles(files);
    e.currentTarget.value = "";
  };
  return (
    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 sm:p-8 text-center hover:bg-slate-50">
      <input id="imageUpload" type="file" accept={ACCEPT_IMAGES} multiple className="hidden" onChange={onChange} />
      <label htmlFor="imageUpload" className="cursor-pointer inline-flex flex-col items-center">
        <div className="h-12 w-12 rounded-full bg-slate-100 ring-1 ring-slate-200 grid place-items-center mb-3">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <p className="text-sm font-medium">Drag & drop or click to upload</p>
        <p className="text-xs text-slate-500 mt-1">{caption}</p>
      </label>
    </div>
  );
}
