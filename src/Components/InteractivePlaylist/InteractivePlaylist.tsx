import { useState, useEffect, type ChangeEvent } from "react";
import { useSelector, useDispatch } from "react-redux";
import ImageSlider, { type ImagePreview } from "./ImageSlider";
import UserMediaGrid from "../Media/UserMediaGrid";
import type { RootState } from "../../../store";
import { usePostPlaylistInteractive } from "../../ReactQuery/PlaylistInterActive/usePostPlaylistInteractive";
import {
  selectSelectedMedia,
  removeSelectedMediaById,
} from "../../Redux/Media/MediaSlice";

const MAX_SLIDES = 5;

export default function CreateInteractivePlaylist({
  onCloseAll,
}: {
  onCloseAll: () => void;
}) {
  const dispatch = useDispatch();

  const [playlistName, setPlaylistName] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);

  const layoutId = useSelector(
    (s: RootState) => s.playlistInteractive.playlistData?.layoutId
  );
  const selectedMedia = useSelector(selectSelectedMedia);
  const { mutate, isPending } = usePostPlaylistInteractive();

  const persistImagesToLocalStorage = (arr: ImagePreview[]) => {
    const simplified = arr
      .filter((i) => typeof i.mediaId === "number")
      .map((img, index) => ({
        index,
        url: img.url,
        mediaId: img.mediaId!,
        type: img.type ?? "image",
      }));
    localStorage.setItem("interactive-image", JSON.stringify(simplified));
  };

  const updateImages = (updated: ImagePreview[]) => {
    const trimmed = updated.slice(0, MAX_SLIDES);
    setImages(trimmed);
    persistImagesToLocalStorage(trimmed);
  };

  // ---- Uploads ----
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []);
    const room = MAX_SLIDES - images.length;
    if (room <= 0) return;

    const valid = uploaded.slice(0, room);
    const previews: ImagePreview[] = valid.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: "image",
    }));
    updateImages([...images, ...previews]);
  };

  const handleReplaceImage = (index: number, file: File) => {
    const newUrl = URL.createObjectURL(file);
    setImages((prev) => {
      const next = [...prev];
      const old = next[index];
      if (old?.file) URL.revokeObjectURL(old.url);
      // If replacing a library slide, also remove it from Redux selection
      if (old?.mediaId) dispatch(removeSelectedMediaById(old.mediaId));
      next[index] = { file, url: newUrl, type: "image", mediaId: undefined };
      persistImagesToLocalStorage(next);
      return next;
    });
  };

  const handleDeleteImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)?.[0];
      if (removed?.file) URL.revokeObjectURL(removed.url);
      if (removed?.mediaId) dispatch(removeSelectedMediaById(removed.mediaId));
      persistImagesToLocalStorage(next);
      return next;
    });
  };
  const normalizeKind = (t: unknown): ImagePreview["type"] =>
    t === "image" || t === "video" ? t : "image";

  const handleReorder = (reordered: ImagePreview[]) => updateImages(reordered);

  // ---- Sync images with Redux-selected media (add/remove) ----
  useEffect(() => {
    setImages((prev) => {
      const byId = new Set(selectedMedia.map((m) => m.id));

      let next = prev.filter((img) => !(img.mediaId && !byId.has(img.mediaId)));

      selectedMedia.forEach((m) => {
        if (
          !next.some((img) => img.mediaId === m.id) &&
          next.length < MAX_SLIDES
        ) {
          next.push({
            mediaId: m.id,
            url: m.url,
            type: normalizeKind(m.type), // now defined
          });
        }
      });

      const trimmed = next.slice(0, MAX_SLIDES);
      persistImagesToLocalStorage(trimmed);
      return trimmed;
    });
  }, [selectedMedia]);

  // auto-scroll slider when images change
  useEffect(() => {
    const slider = document.querySelector(".scroll-smooth");
    if (slider)
      (slider as HTMLElement).scrollTo({
        left: (slider as HTMLElement).scrollWidth,
        behavior: "smooth",
      });
  }, [images]);

  // revoke blob URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((i) => {
        if (i.file) URL.revokeObjectURL(i.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    if (!layoutId) {
      alert("❌ Please select a layout before saving.");
      return;
    }
    if (images.length === 0) {
      alert("❌ Please add at least one slide.");
      return;
    }

    const formData = new FormData();
    formData.append("name", playlistName);
    formData.append("style_id", layoutId.toString());
    formData.append("slide_number", images.length.toString());

    images.forEach((img, index) => {
      formData.append(`slides[${index}][index]`, String(index));
      if (img.mediaId)
        formData.append(`slides[${index}][media_id]`, String(img.mediaId));
      else if (img.file) formData.append(`slides[${index}][media]`, img.file);
    });

    mutate(formData, {
      onSuccess: () => {
        alert("✅ Playlist uploaded successfully!");
        onCloseAll();
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("❌ Upload failed:", msg);
        alert("Failed to upload playlist: " + msg);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl p-6 sm:p-10 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Create Interactive Playlist
        </h2>

        {/* Playlist Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Playlist Name
          </label>
          <input
            type="text"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            placeholder="Enter playlist name"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Layout Download Button */}
        <div className="mb-6">
          <button
            type="button"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-4 py-2 rounded-md border border-gray-300 transition"
          >
            ⬇ Download Layout 1
          </button>
        </div>

        {/* Upload Section */}
        {images.length < MAX_SLIDES && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images in Order
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                id="imageUpload"
                onChange={handleFileUpload}
              />
              <label htmlFor="imageUpload" className="cursor-pointer">
                <div className="text-3xl mb-2">↑</div>
                <p className="text-sm text-gray-600">
                  Drag and drop images here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Support: JPG, PNG, GIF (Max 10MB each)
                </p>
              </label>
            </div>
          </div>
        )}

        {/* Media Library (Redux-driven) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Or pick from your Media
            </label>
            <span className="text-xs text-gray-500">
              {images.length}/{MAX_SLIDES} slides
            </span>
          </div>
          <UserMediaGrid />
        </div>

        {/* Image Slider */}
        {images.length > 0 && (
          <div className="mb-8 scrollbar-hide">
            <ImageSlider
              images={images}
              handleReplaceImage={handleReplaceImage}
              handleDeleteImage={handleDeleteImage}
              handleReorder={handleReorder}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onCloseAll}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-800 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Interactive Playlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
