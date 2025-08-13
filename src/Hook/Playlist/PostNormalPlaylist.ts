import axios from "axios";
import {
  updateSlideAtIndex,
  updateSlotInSlide,
  type PlaylistState,
} from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";
import { useDispatch } from "react-redux";
import { store } from "../../../store";
import { PlaylistPostApi } from "../../API/API";

// Format and send playlist to backend
export const savePlaylistToDatabase = async (playlist: PlaylistState) => {
  const formData = new FormData();
  const token = localStorage.getItem("token");
  // Playlist metadata
  formData.append("id", playlist.id.toString());
  formData.append("name", playlist.name);
  formData.append("type", playlist.type.toString());
  formData.append("NumberOfSlides", playlist.slides.length.toString());
  formData.append(
    "total_duration",
    playlist.slides
      .reduce((sum, slide) => sum + (slide.duration || 0), 0)
      .toString()
  );

  // Slides
  playlist.slides.forEach((slide, slideIndex) => {
    formData.append(`slides[${slideIndex}][index]`, slideIndex.toString());
    formData.append(
      `slides[${slideIndex}][grid_style]`,
      String(slide.grid_style ?? "")
    );
    formData.append(`slides[${slideIndex}][duration]`, String(slide.duration));
    slide.slots.forEach((slot, slotIndex) => {
      formData.append(
        `slides[${slideIndex}][slots][${slotIndex}][index]`,
        slot.index.toString()
      );
      formData.append(
        `slides[${slideIndex}][slots][${slotIndex}][mediaType]`,
        slot.mediaType || ""
      );
      formData.append(
        `slides[${slideIndex}][slots][${slotIndex}][scale]`,
        slot.scale || ""
      );

      // Append the file if it exists
      if (slot.ImageFile instanceof File) {
        formData.append(
          `slides[${slideIndex}][slots][${slotIndex}][ImageFile]`,
          slot.ImageFile,
          slot.ImageFile.name
        );
      }
    });
  });

  // Send request
  const response = await axios.post(PlaylistPostApi, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// Format the payload structure
export const formatPlaylistPayload = (playlist: PlaylistState) => {
  const totalDuration = playlist.slides.reduce(
    (sum, slide) => sum + (slide.duration || 0),
    0
  );
  return {
    id: playlist.id,
    name: playlist.name,
    type: playlist.type,
    NumberOfSlides: playlist.slides.length,
    total_duration: totalDuration,
    slides: playlist.slides.map((slide, index) => {
      const { selectedGrid, ...slideWithoutSelectedGrid } = slide;
      return {
        ...slideWithoutSelectedGrid,
        index,
        grid_style: slide.grid_style,
      };
    }),
  };
};

export const useHandleMediaUpload = (selectedSlideIndex: number | null) => {
  const dispatch = useDispatch();

  const handleMediaUpload = (slotIndex: number, file: File) => {
    if (selectedSlideIndex === null) return;

    const mediaUrl = URL.createObjectURL(file);
    const mediaType = file.type.startsWith("video") ? "video" : "image";

    if (mediaType === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = mediaUrl;

      video.onloadedmetadata = () => {
        const uploadedDuration = Math.round(video.duration);
        console.log(
          `🎥 Uploaded video slot ${slotIndex} duration:`,
          uploadedDuration
        );

        // 1. Update slot
        dispatch(
          updateSlotInSlide({
            slideIndex: selectedSlideIndex,
            slotIndex,
            media: mediaUrl,
            ImageFile: file,
            file,
            mediaType,
          })
        );

        // 2. Wait a tick to ensure Redux state is fresh
        setTimeout(() => {
          const currentSlide =
            store.getState().playlist.slides[selectedSlideIndex];

          const durationPromises = currentSlide.slots
            .filter((slot) => slot.mediaType === "video" && slot.media)
            .map((slot) => {
              return new Promise<number>((resolve) => {
                const tempVid = document.createElement("video");
                tempVid.preload = "metadata";
                tempVid.src = slot.media!;
                tempVid.onloadedmetadata = () => resolve(tempVid.duration);
                tempVid.onerror = () => resolve(0);
              });
            });

          Promise.all(durationPromises).then((durations) => {
            const maxDuration = Math.round(
              Math.max(...durations, uploadedDuration)
            );
            console.log(
              "🕒 Final slide duration (longest video):",
              maxDuration
            );

            dispatch(
              updateSlideAtIndex({
                index: selectedSlideIndex,
                updatedSlide: {
                  ...currentSlide,
                  duration: maxDuration,
                },
              })
            );
          });
        }, 100);
      };
    } else {
      dispatch(
        updateSlotInSlide({
          slideIndex: selectedSlideIndex,
          slotIndex,
          media: mediaUrl,
          ImageFile: file,
          mediaType,
        })
      );
    }
  };

  return handleMediaUpload;
};
