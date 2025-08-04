export type GridSlotConfig = {
  mediaType?: "image" | "video"; // <== NEW
  media?: string | null; // URL of the image or video
  name: string;
  scale: "fit" | "fill" | "stretch" | "blur" | "original";
  index: number;
};

export type GridLayoutConfig = {
  displayName: string;
  slots: GridSlotConfig[];
  duration: number; 
};
// === Grid: One Images ===
export const OneImageGridConfig: GridLayoutConfig = {
  displayName: "default",
  duration: 5,
  slots: [
    {
      name: "Media 1",
      mediaType: "image",
      media: null,
      scale: "fit",
      index: 0,
    },
  ],
};

// === Grid: Two Images ===
export const TwoByTwoConfig: GridLayoutConfig = {
  displayName: "twobyTwo",
    duration: 5,
  slots: [
    {
      name: "Media 1",
      mediaType: "image",
      media: null,
      scale: "fit",
      index: 0,
    },
    {
      name: "Media 2",
      mediaType: "image",
      media: null,
      scale: "fill",
      index: 1,
    },
  ],
};

// === Grid: Two Images ===
export const TwoByTwoColConfig: GridLayoutConfig = {
  displayName: "twobyTwoCol",
    duration: 5,
  slots: [
    {
      name: "Media 1",
      mediaType: "image",
      media: null,
      scale: "fit",
      index: 0,
    },
    {
      name: "Media 2",
      mediaType: "image",
      media: null,
      scale: "fill",
      index: 1,
    },
  ],
};
// === Grid: Three Images ===
export const ThreeColGridConfig: GridLayoutConfig = {
  displayName: "threeCol",
    duration: 5,
  slots: [
    {
      name: "Media 1",
      mediaType: "image",
      media: null,
      scale: "fit",
      index: 0,
    },
    {
      name: "Media 2",
      mediaType: "image",
      media: null,
      scale: "fill",
      index: 1,
    },
    {
      name: "Media 3",
      mediaType: "image",
      media: null,
      scale: "fill",
      index: 2,
    },
  ],
};
export const ThreeRowGridConfig: GridLayoutConfig = {
  displayName: "threeRow",
    duration: 5,
  slots: [
    {
      name: "Media 1",
      mediaType: "image",
      media: null,
      scale: "fit",
      index: 0,
    },
    {
      name: "Media 2",
      mediaType: "image",
      media: null,
      scale: "fill",
      index: 1,
    },
    {
      name: "Media 3",
      mediaType: "image",
      media: null,
      scale: "fill",
      index: 2,
    },
  ],
};
// === Grid: Four Images ===
export const FourImageGridConfig: GridLayoutConfig = {
  displayName: "fourGrid",
    duration: 5,
  slots: [
    {
      name: "Media 1",
      mediaType: "image",
      media: null,
      scale: "fit",
      index: 0,
    },
    {
      name: "Media 2",
      mediaType: "image",
      media: null,
      scale: "fill",
      index: 1,
    },
    {
      name: "Media 3",
      mediaType: "image",
      media: null,
      scale: "fill",
      index: 2,
    },
     {
      name: "Media 4",
      mediaType: "image",
      media: null,
      scale: "fill",
      index: 3,
    },
  ],
};

