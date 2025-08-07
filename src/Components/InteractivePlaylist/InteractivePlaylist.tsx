import { useState, useEffect, type ChangeEvent } from "react";
import { useDispatch } from "react-redux";
import { savePlaylist } from "../../Redux/Playlist/interactivePlaylist/playlistInteractiveSlice";
import ImageSlider from "./ImageSlider";

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
  const dispatch = useDispatch();

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
    const structuredData = {
      Playlist_Name: playlistName,
      type: "interactive",
      numberSlide: images.length,
      slides: images.map((img, index) => ({
        index,
        image: img.url,
      })),
    };
    dispatch(savePlaylist(structuredData));
    alert("Playlist saved to Redux!");
    onCloseAll();
  };

  useEffect(() => {
    const slider = document.querySelector(".scroll-smooth");
    if (slider) {
      slider.scrollTo({ left: slider.scrollWidth, behavior: "smooth" });
    }
  }, [images]);

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-white overflow-y-auto overflow-x-auto ">
      <div className="bg-white w-full max-w-4xl mx-5  sm:mx-auto rounded-2xl p-6 sm:p-8 my-10">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Create Interactive Playlist
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
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

        <div className="mb-4">
          <button
            type="button"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-4 py-2 rounded-md border border-gray-300 transition"
          >
            ⬇ Download Layout 1
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Images in Order
          </label>
          {images.length < 5 && (
            <div className="border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-gray-50 transition">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                id="imageUpload"
                onChange={handleFileUpload}
              />
              <label htmlFor="imageUpload" className="cursor-pointer">
                <div className="text-2xl mb-1">↑</div>
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

        {images.length > 0 && (
          <ImageSlider
            images={images}
            setImages={setImages}
            handleReplaceImage={handleReplaceImage}
            handleDeleteImage={handleDeleteImage}
            handleReorder={handleReorder}
          />
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <button
            onClick={onCloseAll}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-800 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Save Interactive Playlist
          </button>
        </div>
      </div>
    </div>
  );
}
