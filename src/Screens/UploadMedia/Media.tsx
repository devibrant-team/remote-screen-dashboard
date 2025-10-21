import React, { useEffect, useRef, useState } from "react";
import { Upload, ImagePlus, RefreshCw } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useGetMedia } from "../../ReactQuery/Media/useGetMedia";
import { MediaCard } from "../../Components/Media/MediaCard";
import { Lightbox } from "../../Components/Models/LightboxModal";
import { Pager } from "../../Components/Media/Pager";
import {
  setItems,
  setMeta,
  setLoading,
  openLightbox,
} from "../../Redux/Media/MediaLibrarySlice";
import type { RootState } from "../../../store";
import { useUploadMedia } from "../../ReactQuery/Media/PostMedia";

// accept + filter with pdf enabled
import {
  ACCEPT_ATTR,
  filterDisallowed,
} from "../../Hook/Playlist/AllowedUploadExt";

// ---- pdf.js (Vite-friendly worker setup) ----
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
} from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker?worker&url";
GlobalWorkerOptions.workerSrc = workerSrc;

// ---------- Small UI bits ----------
const SkeletonCard: React.FC = () => (
  <div className="relative aspect-square w-full rounded-2xl border border-gray-200 bg-white p-2">
    <div className="h-full w-full animate-pulse rounded-xl bg-gray-200" />
  </div>
);

const EmptyState: React.FC<{ onUpload?: () => void }> = ({ onUpload }) => (
  <div className="flex h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
      <ImagePlus className="h-8 w-8 text-gray-500" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-900">No media yet</h3>
      <p className="mt-1 text-sm text-gray-600">
        Upload images or videos to get started.
      </p>
    </div>
    <button
      type="button"
      onClick={onUpload}
      className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:opacity-100"
    >
      <Upload className="h-4 w-4" /> Upload media
    </button>
  </div>
);

// ---------- Helpers ----------
/**
 * Render all pages of a PDF file to image Files (webp by default).
 * dpi ~144 gives crisp results without being huge. Tweak if needed.
 */
async function pdfToImages(
  pdfFile: File,
  opts?: {
    dpi?: number;
    format?: "image/webp" | "image/jpeg";
    quality?: number;
    onPage?: (i: number, n: number) => void;
  }
): Promise<File[]> {
  const { dpi = 144, format = "image/webp", quality = 0.92, onPage } = opts ?? {};
  const buf = await pdfFile.arrayBuffer();
  const pdf = (await getDocument({ data: buf }).promise) as PDFDocumentProxy;

  const out: File[] = [];
  const scale = dpi / 72;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onPage?.(pageNum, pdf.numPages);

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    if (!ctx) throw new Error("2D context not available");

    // pdf.js v4 types want 'canvas' included
    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    });
    await renderTask.promise;

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), format, quality)
    );

    const ext = format === "image/jpeg" ? "jpg" : "webp";
    const nameBase = pdfFile.name.replace(/\.pdf$/i, "");
    const fileName = `${nameBase}-page-${String(pageNum).padStart(2, "0")}.${ext}`;
    out.push(new File([blob], fileName, { type: format }));

    // cleanup
    canvas.width = 0;
    canvas.height = 0;
  }
  return out;
}

const MediaPage: React.FC = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [progress, setProgress] = useState<number | null>(null); // upload %
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [renderStatus, setRenderStatus] = useState<string | null>(null); // PDF render status

  const upload = useUploadMedia();

  const { page, perPage, items, loading } = useSelector(
    (s: RootState) => s.mediaLibrary
  );

  const { data, isPending, isFetching, isError, refetch } = useGetMedia({
    page,
    perPage,
  });

  // mirror React Query flags to Redux (optional)
  useEffect(() => {
    dispatch(setLoading(isPending || isFetching));
  }, [isPending, isFetching, dispatch]);

  // push API payload into Redux
  useEffect(() => {
    if (!data) return;
    dispatch(setItems(data.media ?? []));
    dispatch(
      setMeta({
        last_page: Number(data.meta?.last_page || 1),
        total: Number(data.meta?.total || (data.media?.length ?? 0)),
      })
    );
  }, [data, dispatch]);

  const onUpload = () => fileInputRef.current?.click();

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const all = Array.from(e.target.files || []);
    if (!all.length) return;

    const { good, bad } = filterDisallowed(all);

    if (bad.length) {
      const firstFew = bad.slice(0, 3).map((f) => f.name).join(", ");
      setErrorMsg(
        `Only images/videos/PDFs are allowed. Blocked: ${firstFew}${
          bad.length > 3 ? `, +${bad.length - 3} more` : ""
        }`
      );
    } else {
      setErrorMsg(null);
    }

    if (!good.length) {
      // reset so selecting same files re-triggers onChange
      e.currentTarget.value = "";
      return;
    }

    try {
      // Expand PDFs → page images
      const expanded: File[] = [];
      for (const f of good) {
        if (f.type === "application/pdf") {
          setRenderStatus(`Rendering ${f.name} (preparing pages)…`);
          const imgs = await pdfToImages(f, {
            dpi: 144,
            format: "image/webp",
            quality: 0.92,
            onPage: (i, n) =>
              setRenderStatus(`Rendering ${f.name}: page ${i}/${n}…`),
          });
          expanded.push(...imgs);
        } else {
          expanded.push(f);
        }
      }

      // If a PDF had zero pages (unlikely) or nothing valid, guard:
      if (!expanded.length) {
        setErrorMsg("No renderable pages/files found.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setRenderStatus(null);
        return;
      }

      // Kick off upload for the union set
      setRenderStatus(null);
      setProgress(0);
      upload.mutate(
        { files: expanded, onProgress: (p: number) => setProgress(p) },
        {
          onError: (err: any) => {
            const msg =
              err?.response?.data?.message ??
              "Upload failed. Please try again.";
            setErrorMsg(msg);
          },
          onSettled: () => {
            setProgress(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          },
        }
      );
    } catch (err: any) {
      setRenderStatus(null);
      setProgress(null);
      setErrorMsg(err?.message ?? "Failed to process PDF.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mx-10 max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Library
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Browse and manage your uploaded media.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading || upload.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading || upload.isPending ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={onUpload}
            disabled={upload.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--mainred,_#ef4444)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:opacity-100 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {upload.isPending
              ? progress != null
                ? `Uploading ${progress}%`
                : "Uploading…"
              : "Upload"}
          </button>
        </div>
      </div>

      {/* Status banners */}
      {renderStatus && (
        <div
          className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800"
          role="status"
          aria-live="polite"
        >
          {renderStatus}
        </div>
      )}
      {errorMsg && (
        <div
          className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          role="status"
          aria-live="polite"
        >
          {errorMsg}
        </div>
      )}

      {/* Content */}
      {isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load media. Please try again.
        </div>
      ) : loading && !items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: perPage }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !items.length ? (
        <EmptyState onUpload={onUpload} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((m, idx) => (
              <MediaCard
                key={m.id}
                id={m.id}
                storage={m.storage}
                url={m.media}
                type={m.type}
                onClick={() => dispatch(openLightbox(idx))}
              />
            ))}
          </div>
          <Pager />
        </>
      )}

      {/* Lightbox is global (no props) */}
      <Lightbox />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        className="hidden"
        onChange={handlePick}
      />
    </div>
  );
};

export default MediaPage;
