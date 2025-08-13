import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import {
  addSlide,
  setSelectedSlideIndex,
  updateSlideAtIndex,
} from "../../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import { OneImageGridConfig } from "../../../Config/GridConfig/DefaultGridConfig";
import { Plus, Clock } from "lucide-react";

const NormalSlider = () => {
  const dispatch = useDispatch();

  const playlistSlides = useSelector(
    (state: RootState) => state.playlist.slides
  );

  const selectedSlide = useSelector(
    (state: RootState) => state.playlist.selectedSlideIndex
  );


  const handleAddSlide = () => {
    const defaultSlide = {
      duration: 10,
      selectedGrid: "default",
      slots: OneImageGridConfig.slots.map((slot: any) => ({
        ...slot,
        media: null as string | null,
        mediaType: undefined as "image" | "video" | undefined,
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
    <section className="p-4 md:p-6 max-h-screen">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">
          Normal Slider
        </h2>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Total slides: <b>{playlistSlides.length}</b>
          </span>
          <button
            onClick={handleAddSlide}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium shadow-sm hover:shadow transition bg-white hover:bg-gray-50 active:scale-[0.99]"
            aria-label="Add current slide to playlist"
          >
            <Plus size={16} color="red" />
            Add slide
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {playlistSlides.map((slide: any, index: number) => (
          <div
            key={index}
            onClick={() => dispatch(setSelectedSlideIndex(index))}
            aria-pressed={selectedSlide === index}
            className={`group cursor-pointer rounded-2xl border p-2 transition-all duration-200 bg-white
              ${
                selectedSlide === index
                  ? "border-red-500 ring-2 ring-red-200 shadow-md"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
          >
            <div className="w-full aspect-[7/5] overflow-hidden rounded-xl bg-white">
              {slide.slots[0]?.media ? (
                slide.slots[0].mediaType === "video" ? (
                  <div className="flex items-center justify-center w-full h-full text-xs font-medium">
                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-900/80 px-2 py-1 text-white">
                      🎥 Video
                    </span>
                  </div>
                ) : (
                  <img
                    src={slide.slots[0].media as string}
                    alt={`Slide ${index + 1}`}
                    className="object-contain w-full h-full transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No media
                </div>
              )}
            </div>

            <p className="text-center text-sm mt-2 font-medium">
              Slide {index + 1}
            </p>

            <div className="mt-2">
              <label className="mb-1 flex items-center justify-center gap-1 text-[11px] text-gray-500">
                <Clock size={12} /> Duration (sec)
              </label>
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={slide.duration}
                onChange={(e) =>
                  handleDurationChange(index, Number(e.target.value))
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NormalSlider;
