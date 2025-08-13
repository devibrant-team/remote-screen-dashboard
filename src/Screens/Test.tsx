import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { OneImageGridConfig } from "../Config/GridConfig/DefaultGridConfig";
import type { RootState } from "../../store";
import {
  addSlide,
  setSelectedSlideIndex,
} from "../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";

const Test = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [firstSlideCreated, setFirstSlideCreated] = useState(false);

  const slides = useSelector((state: RootState) => state.playlist.slides);

  const handleCreateAndNavigate = () => {
    if (!firstSlideCreated) {
      const defaultSlide = {
        name: "",
        id: crypto.randomUUID(),
        duration: 10,
        scale: "Original Scale",
        selectedGrid: "default",
        slots: OneImageGridConfig.slots.map((slot) => ({
          ...slot,
          media: null,
          mediaType: undefined,
        })),
      };

      dispatch(addSlide(defaultSlide));
      dispatch(setSelectedSlideIndex(0));
      setFirstSlideCreated(true); // ✅ prevent duplicate
    } else {
      dispatch(setSelectedSlideIndex(0)); // Just select and go
    }

    navigate("/playlist");
  };

  return (
    <div className="p-10">
      <button
        onClick={handleCreateAndNavigate}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        Go to Playlist & Create First Slide
      </button>
    </div>
  );
};

export default Test;
