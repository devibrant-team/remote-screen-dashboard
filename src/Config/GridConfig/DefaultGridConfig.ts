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
  id:number;
};
// === Grid: One Images ===
export const OneImageGridConfig: GridLayoutConfig = {
  id:1,
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
  id:2,
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
  id:3,
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
  id:4,
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
  id:5,
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
  id:6,
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
