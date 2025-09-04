import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
// import  { type ImagePreview } from "./ImageSlider";
import UserMediaGrid from "../../Media/UserMediaGrid";
import type { RootState } from "../../../../store";

import { usePostPlaylistInteractive } from "../../../ReactQuery/PlaylistInterActive/usePostPlaylistInteractive";
import { useUpdatePlaylistInteractive } from "../../../ReactQuery/PlaylistInterActive/useEditPlaylistInteractive";

import {
  selectSelectedMedia,
  removeSelectedMediaById,
  clearSelectedMedia,                 // 👈 NEW
} from "../../../Redux/Media/MediaSlice";
import {
  setIsEditing,
} from "../../../Redux/Playlist/interactivePlaylist/interactiveSlice";
import {
  clearPlaylist,                      // 👈 NEW
} from "../../../Redux/Playlist/interactivePlaylist/playlistInteractiveSlice";

import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import {
  useSharedSlides,
  isValidImageFile,
} from "../shared/useSharedSlides";
import type { SlideItem } from "../shared/SharedSlides";

import UploadDropzone from "./UploadDropzone";
import PreviewArrange from "./PreviewArrange";
import FooterActions from "./FooterActions";
import { StatPill, ProgressBar, Section } from "./uiPrimitives";

/**
 * CreateInteractivePlaylist (Compact container)
 * - Keeps business logic here (Redux, React Query, validation, navigation)
 * - Lightweight, reusable UI pieces live in small components
 */

const HEADER = {
  create: "Create Interactive Playlist",
  edit: "Edit Interactive Playlist",
};

// Example PDF links per layout (replace with real links later)
const LAYOUT_PDF: Record<number, { url: string; label: string }> = {
  2: { url: "https://example.com/layout-2-example.pdf", label: "Layout 2 – Example PDF" },
  3: { url: "https://example.com/layout-3-example.pdf", label: "Layout 3 – Example PDF" },
};

export default function CreateInteractivePlaylist({
  onCloseAll,
}: {
  onCloseAll: () => void;
}) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [playlistName, setPlaylistName] = useState("");

  const {
    slides,
    addUploads,
    mergeLibrary,
    replaceAt,
    deleteAt,
    reorder,
    toFormData,
    max, // Number.POSITIVE_INFINITY if no cap; otherwise exact required count
  } = useSharedSlides();

  const sliderRef = useRef<HTMLDivElement | null>(null);

  const layoutId = useSelector(
    (s: RootState) => s.playlistInteractive.playlistData?.layoutId
  );
  const selectedMedia = useSelector(selectSelectedMedia);

  const { isEditing, details: editDetails, selectedId } = useSelector(
    (s: RootState) => s.interactive
  );

  const { mutate: createPlaylist, isPending: isCreating } = usePostPlaylistInteractive();
  const { mutate: updatePlaylist, isPending: isUpdating } = useUpdatePlaylistInteractive();

  // ---- derived UI states
  const hasExactCap = Number.isFinite(max);
  const requiredCount = hasExactCap ? (max as number) : undefined;
  const currentCount = slides.length;
  const remaining = hasExactCap ? Math.max(0, (max as number) - currentCount) : undefined;

  const saveDisabledForCount = useMemo(() => {
    if (hasExactCap) return currentCount !== requiredCount; // exact match required
    return currentCount === 0; // at least one when uncapped
  }, [hasExactCap, currentCount, requiredCount]);

  // ---- hydrate from edit details
  useEffect(() => {
    if (!isEditing || !editDetails) return;

    setPlaylistName(editDetails.name ?? "");

    const mapped: SlideItem[] = (editDetails.slides ?? [])
      .slice()
      .sort((a, b) => a.index - b.index)
      .filter(
        (s) => !!s?.media && !/\.(ico|mp4|webm|mov|m4v|avi|mkv|3gp)$/i.test(s.media)
      )
      .map((s) => ({
        source: "library",
        url: s.media,
        mediaId: s.media_id,
        type: "image",
      }));

    reorder(mapped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, editDetails?.id]);

  // ---- sync with Redux-selected media
  useEffect(() => {
    if (!selectedMedia) return;
    const picks = selectedMedia
      .filter((m) => !m.type || m.type === "image")
      .map((m) => ({ id: m.id, url: m.url }));
    mergeLibrary(picks);
  }, [selectedMedia, mergeLibrary]);

  // ---- auto-scroll when slides change
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [slides]);

  // ---- uploads (used by UploadDropzone)
  const onUploadFiles = (files: File[]) => {
    const cap = Number.isFinite(max) ? (max as number) : Infinity;
    const room = Math.max(0, cap - slides.length);
    if (room <= 0) return;

    const allowed = files.slice(0, room === Infinity ? files.length : room);
    const valid = allowed.filter(isValidImageFile);
    if (valid.length < allowed.length) {
      alert("Some files were ignored (only JPG/PNG/WEBP; no .ico or video).");
    }
    addUploads(valid);
  };

  // ---- replace
  const handleReplaceImage = (index: number, file: File) => {
    const res = replaceAt(index, file);
    if (!res.ok) {
      alert("This file type is not allowed. Please choose a JPG/PNG/WEBP (no .ico, no video).");
      return;
    }
    if (res.removedLibraryMediaId) {
      dispatch(removeSelectedMediaById(res.removedLibraryMediaId));
    }
  };

  // ---- delete
  const handleDeleteImage = (index: number) => {
    const { removedLibraryMediaId } = deleteAt(index);
    if (removedLibraryMediaId) {
      dispatch(removeSelectedMediaById(removedLibraryMediaId));
    }
  };

  // ---- reorder (adapter for ImageSlider signature)
  // const onReorderFromSlider = (arr: ImagePreview[]) => {
  //   reorder(arr as unknown as SlideItem[]);
  // };

  const isSaving = isCreating || isUpdating;

  // ---- helper: clear UI + Redux on close/save success
  const resetAll = () => {
    // local UI
    setPlaylistName("");
    reorder([]); // clear slides in useSharedSlides

    // redux
    dispatch(clearSelectedMedia()); // clear selected media ids/urls
    dispatch(clearPlaylist());      // clear layout/playlistInteractive state
    dispatch(setIsEditing(false));  // exit edit mode
  };

  // ---- strict save rule
  const handleSave = () => {
    if (!layoutId) return alert("❌ Please select a layout before saving.");
    if (!playlistName.trim()) return alert("❌ Please enter a playlist name.");
    if (slides.length === 0) return alert("❌ Please add at least one slide.");

    if (hasExactCap && slides.length !== requiredCount) {
      const diff = (requiredCount ?? 0) - slides.length;
      const msg =
        diff > 0
          ? `❌ You need ${diff} more slide${diff === 1 ? "" : "s"} (required: ${requiredCount}).`
          : `❌ Remove ${Math.abs(diff)} slide${Math.abs(diff) === 1 ? "" : "s"} (required: ${requiredCount}).`;
      alert(msg);
      return;
    }

    const formData = toFormData({ name: playlistName, styleId: layoutId });

    if (isEditing && selectedId) {
      updatePlaylist(
        { id: selectedId, payload: formData, useMethodOverride: true },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["interactiveplaylist"] });
            queryClient.invalidateQueries({ queryKey: ["interactiveplaylist", "details", selectedId] });
            alert("✅ Playlist updated!");
            resetAll();            // 👈 clear UI + Redux
            onCloseAll?.();
            navigate("/mediacontent");
          },
          onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : "Unknown error";
            console.error("❌ Update failed:", msg);
            alert("Failed to update playlist: " + msg);
          },
        }
      );
    } else {
      createPlaylist(formData, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["interactiveplaylist"] });
          alert("✅ Playlist uploaded successfully!");
          resetAll();              // 👈 clear UI + Redux
          onCloseAll?.();
          navigate("/mediacontent");
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Unknown error";
          console.error("❌ Upload failed:", msg);
          alert("Failed to upload playlist: " + msg);
        },
      });
    }
  };

  const pdfForLayout = layoutId ? LAYOUT_PDF[layoutId] : undefined;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/55 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200">
          <div className="px-5 sm:px-8 py-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-50 ring-1 ring-red-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7h18M5 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
                <path d="M9 7V5a3 3 0 0 1 3-3 3 3 0 0 1 3 3v2" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {isEditing ? HEADER.edit : HEADER.create}
              </h2>
              <p className="text-[12px] text-slate-500 leading-4 mt-0.5">
                Choose a layout, add images, then save. Clear progress indicators guide you.
              </p>
            </div>

            {/* Header stats */}
            <div className="hidden md:flex items-center gap-2">
              <StatPill label="Layout" value={`#${layoutId ?? "—"}`} />
              <StatPill label="Slides" value={hasExactCap ? `${currentCount} / ${requiredCount}` : `${currentCount} / ∞`} />
              {hasExactCap && <StatPill label="Remaining" value={remaining ?? 0} />}
              {pdfForLayout && (
                <a
                  href={pdfForLayout.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  title={pdfForLayout.label}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-red-700 ring-1 ring-red-200 bg-red-50 hover:bg-red-100 active:scale-[0.99] transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M12 18v-6" />
                    <path d="M9 15l3 3 3-3" />
                  </svg>
                  Example (PDF)
                </a>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="px-5 sm:px-8 pb-3">
            <ProgressBar current={currentCount} total={requiredCount} />
          </div>

          {/* Cap warning */}
          {hasExactCap && currentCount !== requiredCount && (
            <div className="px-5 sm:px-8 pb-3">
              <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-xs">
                {currentCount < (requiredCount ?? 0)
                  ? `You need ${(requiredCount ?? 0) - currentCount} more slide${(requiredCount ?? 0) - currentCount === 1 ? "" : "s"} to reach the required ${requiredCount}.`
                  : `You have ${currentCount - (requiredCount ?? 0)} extra slide${currentCount - (requiredCount ?? 0) === 1 ? "" : "s"}. Remove to reach exactly ${requiredCount}.`}
              </div>
            </div>
          )}
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto space-y-6 sm:space-y-8 px-5 sm:px-8 pb-6 pt-4 scrollbar-hide *:focus-visible:outline-none">
          <Section
            title="Playlist"
            subtitle="Give your playlist a recognizable name."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 scrollbar-hide">
              <label className="block">
                <span className="sr-only">Playlist name</span>
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Enter playlist name"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </label>
              {/* <div className="flex items-center gap-2 text-[12px] text-slate-500">
                <StatPill label="Layout" value={`#${layoutId ?? "—"}`} />
                <StatPill label="Slides" value={hasExactCap ? `${currentCount} / ${requiredCount}` : `${currentCount} / ∞`} />
                {hasExactCap && <StatPill label="Remaining" value={remaining ?? 0} />}
              </div> */}
            </div>
          </Section>

          {/* Uploads */}
          {(!Number.isFinite(max) || slides.length < (max as number)) && (
            <Section
              title="Uploads"
              subtitle="Add new images from your device (JPG, PNG, WEBP). No video or .ico."
              right={<span className="text-xs text-slate-500">{hasExactCap ? `${currentCount}/${requiredCount} slides` : `${currentCount}/∞ slides`}</span>}
            >
              <UploadDropzone
                caption={hasExactCap ? `Exactly ${requiredCount} slides required` : "No strict limit"}
                onFiles={onUploadFiles}
              />
            </Section>
          )}

          {/* Media Library */}
          <Section
            title="Media Library"
            subtitle="Select existing images from your library. Videos are hidden for this layout."
            right={<span className="text-xs text-slate-500">{currentCount}{hasExactCap ? ` / ${requiredCount}` : " / ∞"} slides</span>}
          >
            <UserMediaGrid currentSlidesCount={currentCount} maxSelectable={max as number | undefined} />
          </Section>

          {/* Preview & Arrange */}
          <Section
            title="Preview & Arrange"
            subtitle="Drag to reorder. Use the card actions to replace or delete."
          >
            <div className="scrollbar-hide" ref={sliderRef}>
              <PreviewArrange
                slides={slides}
                onReplace={handleReplaceImage}
                onDelete={handleDeleteImage}
                onReorder={(next) => reorder(next)}
              />
            </div>
          </Section>
        </main>

        {/* Sticky Footer */}
        <footer className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 px-5 sm:px-8 py-4">
          <FooterActions
            summary={
              hasExactCap
                ? `Required: ${requiredCount} • Current: ${currentCount}${(remaining ?? 0) > 0 ? ` • Remaining: ${remaining}` : ""}`
                : `Current: ${currentCount} slides`
            }
            onCancel={() => {
              resetAll();         // 👈 clear UI + Redux on cancel
              onCloseAll();
            }}
            onSave={handleSave}
            disabled={isSaving || saveDisabledForCount}
            label={isSaving ? (isEditing ? "Updating…" : "Saving…") : isEditing ? "Update Playlist" : "Save Playlist"}
          />
        </footer>
      </div>
    </div>
  );
}
