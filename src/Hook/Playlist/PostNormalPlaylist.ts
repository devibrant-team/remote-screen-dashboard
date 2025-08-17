import axios from "axios";
import { type PlaylistState } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";

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
  formData.append("ratio", playlist.selectedRatio);
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
      if (slot.mediaId != null) {
        formData.append(
          `slides[${slideIndex}][slots][${slotIndex}][mediaId]`,
          String(slot.mediaId)
        );
      }

      // Append the file if it exists
      if (slot.ImageFile instanceof File) {
        formData.append(
          `slides[${slideIndex}][slots][${slotIndex}][ImageFile]`,
          slot.ImageFile,
          slot.ImageFile.name
        );
      }
      // inside your slides.forEach(...slot loop)
      if (slot.widget) {
        formData.append(
          `slides[${slideIndex}][slots][${slotIndex}][widget][type]`,
          slot.widget.type
        );
        formData.append(
          `slides[${slideIndex}][slots][${slotIndex}][widget][position]`,
          slot.widget.position
        );

        if (slot.widget.type === "weather") {
          const w = slot.widget as { type: "weather"; city: string };
          formData.append(
            `slides[${slideIndex}][slots][${slotIndex}][widget][city]`,
            w.city
          );
        } else if (slot.widget.type === "clock") {
          const c = slot.widget as {
            type: "clock";
            timezone?: string;
            label?: string;
            showSeconds?: boolean;
            twentyFourHour?: boolean;
          };
          if (c.timezone)
            formData.append(
              `slides[${slideIndex}][slots][${slotIndex}][widget][timezone]`,
              c.timezone
            );
          if (c.label)
            formData.append(
              `slides[${slideIndex}][slots][${slotIndex}][widget][label]`,
              c.label
            );
          if (typeof c.showSeconds === "boolean")
            formData.append(
              `slides[${slideIndex}][slots][${slotIndex}][widget][showSeconds]`,
              String(c.showSeconds)
            );
          if (typeof c.twentyFourHour === "boolean")
            formData.append(
              `slides[${slideIndex}][slots][${slotIndex}][widget][twentyFourHour]`,
              String(c.twentyFourHour)
            );
        }
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
    ratio: playlist.selectedRatio,
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
