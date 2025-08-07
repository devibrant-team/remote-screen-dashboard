import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import {
  addSlide,
  setSelectedSlideIndex,
  updateSlideAtIndex, // ✅ Make sure this exists
} from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import { OneImageGridConfig } from "../../../Config/GridConfig/DefaultGridConfig";

const NormalSlider = () => {
  const dispatch = useDispatch();

  const playlistSlides = useSelector(
    (state: RootState) => state.playlist.slides
  );
  const playlist = useSelector((state: RootState) => state.playlist);

  const selectedSlide = useSelector(
    (state: RootState) => state.playlist.selectedSlideIndex
  );

  useEffect(() => {
    console.log("📦 Full Playlist Structure:", playlist);
  }, [playlist]);

  const handleAddSlide = () => {
    const defaultSlide = {
      duration: 10,
      selectedGrid: "default",
      slots: OneImageGridConfig.slots.map((slot) => ({
        ...slot,
        media: null,
        mediaType: undefined,
      })),
    };

    const newIndex = playlistSlides.length;
    dispatch(addSlide(defaultSlide));
    dispatch(setSelectedSlideIndex(newIndex));
  };

  const handleDurationChange = (index: number, newDuration: number) => {
    const updatedSlide = { ...playlistSlides[index], duration: newDuration };
    dispatch(updateSlideAtIndex({ index, updatedSlide }));
  };

  useEffect(() => {
    if (playlistSlides.length > 0 && selectedSlide === null) {
      dispatch(setSelectedSlideIndex(0));
    }
  }, [playlistSlides, selectedSlide, dispatch]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Normal Slider Test</h2>

      <button
        onClick={handleAddSlide}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-6"
      >
        Add Current Slide to Playlist
      </button>

      <div className="flex gap-4 flex-wrap">
        {playlistSlides.map((slide, index) => (
          <div
            key={index}
            onClick={() => dispatch(setSelectedSlideIndex(index))}
            className={`cursor-pointer rounded-lg border-4 p-2 transition-all duration-200 ${
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

            <p className="text-center text-sm mt-1 font-medium">
              Slide {index + 1}
            </p>

            {/* 🔢 Duration input */}
            <div className="mt-1">
              <label className="block text-xs text-gray-600 text-center">
                Duration (sec)
              </label>
              <input
                type="number"
                min={1}
                value={slide.duration}
                onChange={(e) =>
                  handleDurationChange(index, Number(e.target.value))
                }
                className="w-full text-center border rounded p-1 text-sm"
              />
            </div>
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
