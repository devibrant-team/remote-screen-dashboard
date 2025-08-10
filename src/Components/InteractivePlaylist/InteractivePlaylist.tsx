import { useState, useEffect, type ChangeEvent } from "react";
import {  useSelector } from "react-redux";
// import { savePlaylist } from "../../Redux/Playlist/interactivePlaylist/playlistInteractiveSlice";
import ImageSlider from "./ImageSlider";
import type { RootState } from "../../../store";
import { usePostPlaylistInteractive } from "./../../Hook/PlaylistInterActive/usePostPlaylistInteractive";

interface ImagePreview {
  file: File;
  url: string;
}

interface CreateInteractivePlaylistProps {
  onCloseAll: () => void;
}

export default function CreateInteractivePlaylist({
  onCloseAll,
}: CreateInteractivePlaylistProps) {
  const [playlistName, setPlaylistName] = useState<string>("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  // const dispatch = useDispatch();

  const layoutId = useSelector(
    (state: RootState) => state.playlistInteractive.playlistData?.layoutId
  );
  const { mutate, isPending } = usePostPlaylistInteractive();

  const persistImagesToLocalStorage = (images: ImagePreview[]) => {
    const simplified = images.map((img, index) => ({
      index,
      image: img.url,
    }));
    localStorage.setItem("interactive-image", JSON.stringify(simplified));
  };

  const updateImages = (updated: ImagePreview[]) => {
    setImages(updated);
    persistImagesToLocalStorage(updated);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []);
    const validImages = uploaded.slice(0, 5 - images.length);
    const imagePreviews = validImages.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    updateImages([...images, ...imagePreviews]);
  };

  const handleReplaceImage = (index: number, file: File) => {
    const newUrl = URL.createObjectURL(file);
    const updated = [...images];
    updated[index] = { file, url: newUrl };
    updateImages(updated);
  };

  const handleDeleteImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    updateImages(updated);
  };

  const handleReorder = (reordered: ImagePreview[]) => {
    updateImages(reordered);
  };

  const handleSave = () => {
    if (!layoutId) {
      alert("❌ Please select a layout before saving.");
      return;
    }

    if (images.length === 0) {
      alert("❌ Please upload at least one image.");
      return;
    }

    const formData = new FormData();
    formData.append("name", playlistName);
    formData.append("style_id", layoutId.toString());
    formData.append("slide_number", images.length.toString());

    images.forEach((img, index) => {
      formData.append(`slides[${index}][index]`, index.toString());
      const mediaId: string | number | null = null; // or your value
      if (mediaId != null) {
        formData.append(`slides[${index}][media_id]`, String(mediaId));
      }
      formData.append(`slides[${index}][media]`, img.file); // ✅ This must be the actual File
    });

    mutate(formData, {
      onSuccess: () => {
        alert("✅ Playlist uploaded successfully!");
        onCloseAll();
      },
      onError: (err: unknown) => {
        if (err instanceof Error) {
          console.error("❌ Upload failed:", err.message);
          alert("Failed to upload playlist: " + err.message);
        } else {
          console.error("❌ Upload failed:", err);
          alert("An unknown error occurred.");
        }
      },
    });
  };

  useEffect(() => {
    const slider = document.querySelector(".scroll-smooth");
    if (slider) {
      slider.scrollTo({ left: slider.scrollWidth, behavior: "smooth" });
    }
  }, [images]);

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
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Images in Order
          </label>
          {images.length < 5 && (
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
          )}
        </div>

        {/* Image Slider */}
        {images.length > 0 && (
          <div className="mb-8 scrollbar-hide">
            <ImageSlider
              images={images}
              setImages={setImages}
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
