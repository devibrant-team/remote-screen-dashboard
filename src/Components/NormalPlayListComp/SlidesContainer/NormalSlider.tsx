import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import {
  addSlide,
  setSelectedSlideIndex,
} from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import { OneImageGridConfig } from "../../../Config/GridConfig/DefaultGridConfig";

const NormalSlider = () => {
  const dispatch = useDispatch();

  const playlistSlides = useSelector(
    (state: RootState) => state.playlist.slides
  );
  const playlist = useSelector((state: RootState) => state.playlist);
  useEffect(() => {
    console.log("📦 Full Playlist Structure:", playlist);
  }, [playlist]);

  const selectedSlide = useSelector(
    (state: RootState) => state.playlist.selectedSlideIndex
  );
  console.log("HEHE", selectedSlide);
  // Add current slide to playlist
  const handleAddSlide = () => {
    const defaultSlide = {
      duration: 10,
      scale: "Original Scale",
      selectedGrid: "default",
      slots: OneImageGridConfig.slots.map((slot) => ({
        ...slot,
        media: null,
        mediaType: undefined,
      })),
    };

    // Get the index of the new slide BEFORE adding it
    const newIndex = playlistSlides.length;

    dispatch(addSlide(defaultSlide));
    dispatch(setSelectedSlideIndex(newIndex)); // ✅ Select the new one
  };

  // Auto-select the first slide by default
  useEffect(() => {
    if (playlistSlides.length > 0 && selectedSlide === null) {
      dispatch(setSelectedSlideIndex(0));
    }
  }, [playlistSlides, selectedSlide, dispatch]);

  // Logging for debugging

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Normal Slider Test</h2>

      <button
        onClick={handleAddSlide}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-6"
      >
        Add Current Slide to Playlist
      </button>

      {/* Slide Thumbnails Preview */}
      <div className="flex gap-4 flex-wrap">
        {playlistSlides.map((slide, index) => (
          <div
            key={index}
            onClick={() => dispatch(setSelectedSlideIndex(index))}
            className={`cursor-pointer rounded-lg border-4 transition-all duration-200 ${
              selectedSlide === index ? "border-blue-600" : "border-transparent"
            }`}
          >
            <div className="w-28 h-20 overflow-hidden bg-gray-100 rounded-md">
              {slide.slots[0]?.media ? (
                slide.slots[0].mediaType === "video" ? (
                  <div className="flex items-center justify-center w-full h-full bg-red-300 text-white text-xs">
                    🎥 Video
                  </div>
                ) : (
                  <img
                    src={slide.slots[0].media}
                    alt={`Slide ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  No Media
                </div>
              )}
            </div>
            <p className="text-center text-sm mt-1 font-medium">{index + 1}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-gray-700">
        Total slides in playlist: {playlistSlides.length}
      </p>
    </div>
  );
};

export default NormalSlider;
