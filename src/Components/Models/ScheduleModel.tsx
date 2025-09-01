// Components/ScheduleModel.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import InteractivePlaylist from "../../Screens/MediaContent/InteractivePlaylistCard";
import NormalPlaylistCard from "../../Screens/MediaContent/NormalPlaylistCard";
import GroupScreensSection from "../../Screens/ScreenManagement/GroupScreensSection";
import SingleScreensSection from "../../Screens/ScreenManagement/SingleScreensSection";

type ScheduleModelProps = {
  open: boolean;
  initialName: string;
  onSave: (name: string) => void;
  onClose: () => void;
  title?: string;
};

type RootTab = "playlists" | "screens";
type PlaylistTab = "normal" | "interactive";

const ScheduleModel: React.FC<ScheduleModelProps> = ({
  open,
  initialName,
  onSave,
  onClose,
  title = "Edit Block",
}) => {
  const [name, setName] = useState(initialName);
  const [tab, setTab] = useState<RootTab>("playlists");
  const [playlistTab, setPlaylistTab] = useState<PlaylistTab>("normal");

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync name when initialName changes (e.g., editing different block)
  useEffect(() => setName(initialName), [initialName]);

  // Focus the name field when the modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Close on ESC
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );
  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onKey]);

  // Close when clicking the overlay (but not inner dialog)
  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim()); // parent closes
  };

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onMouseDown={handleOverlayMouseDown}
      className="fixed inset-0 z-[9999] grid place-items-center bg-black/30 backdrop-blur-sm p-4"
      aria-labelledby="schedule-modal-title"
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-6xl rounded-2xl border border-neutral-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
          <div>
            <h2
              id="schedule-modal-title"
              className="text-lg font-extrabold text-gray-900"
            >
              {title}
            </h2>
            <p className="text-xs text-gray-600">Rename block and attach content</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-gray-900 hover:bg-red-500 hover:text-white"
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Name row */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-neutral-200">
          <label className="text-sm font-semibold text-gray-900">Block name</label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="Unnamed"
            className="min-w-[220px] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-red-500/50"
          />
          <button
            onClick={handleSave}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("playlists")}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                tab === "playlists"
                  ? "border-red-600 bg-red-500 text-white"
                  : "border-red-500 bg-white text-gray-900 hover:bg-red-50"
              }`}
            >
              Playlists
            </button>
            <button
              onClick={() => setTab("screens")}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                tab === "screens"
                  ? "border-red-600 bg-red-500 text-white"
                  : "border-red-500 bg-white text-gray-900 hover:bg-red-50"
              }`}
            >
              Screens
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5">
          {tab === "playlists" ? (
            <>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setPlaylistTab("normal")}
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                    playlistTab === "normal"
                      ? "border-red-600 bg-red-500 text-white"
                      : "border-red-500 bg-white text-gray-900 hover:bg-red-50"
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setPlaylistTab("interactive")}
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                    playlistTab === "interactive"
                      ? "border-red-600 bg-red-500 text-white"
                      : "border-red-500 bg-white text-gray-900 hover:bg-red-50"
                  }`}
                >
                  Interactive
                </button>
              </div>

              <div className="mt-4 max-h-[62vh] overflow-auto rounded-xl border border-neutral-200 p-3">
                {playlistTab === "normal" ? (
                  <NormalPlaylistCard />
                ) : (
                  <InteractivePlaylist />
                )}
              </div>
            </>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 p-3">
                <h3 className="mb-2 text-sm font-extrabold text-gray-900">
                  Single Screens
                </h3>
                <div className="max-h-[58vh] overflow-auto">
                  <SingleScreensSection />
                </div>
              </div>
              <div className="rounded-xl border border-neutral-200 p-3">
                <h3 className="mb-2 text-sm font-extrabold text-gray-900">
                  Groups
                </h3>
                <div className="max-h-[58vh] overflow-auto">
                  <GroupScreensSection />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer (secondary actions if needed) */}
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-neutral-100"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ScheduleModel;
