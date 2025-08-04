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
};
// === Grid: One Images ===
export const OneImageGridConfig: GridLayoutConfig = {
  displayName: "default",
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

