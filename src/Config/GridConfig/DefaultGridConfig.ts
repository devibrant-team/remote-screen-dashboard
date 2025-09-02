export type WidgetPosition =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

// Weather
export type WeatherWidgetConfig = {
  type: "weather";
  city: string; // ⬅️ was "Riyadh" (literal) → make it string
  position: WidgetPosition;
};

// Clock
export type ClockWidgetConfig = {
  type: "clock";
  timezone?: string; // default: "Asia/Riyadh" (Jeddah)
  city: string; // default: "Jeddah"
  showSeconds?: boolean; // default: true
  twentyFourHour?: boolean; // default: true
  position: WidgetPosition;
};

// Union
export type SlotWidget = WeatherWidgetConfig | ClockWidgetConfig;

export type GridSlotConfig = {
  mediaType?: "image" | "video";
  media?: string | null;
  mediaId?: number | null;
  ImageFile: File | null;
  scale: "fit" | "fill" | "stretch" | "blur" | "original";
  index: number;
  file?: File | null;
  widget?: SlotWidget | null;
};

export type GridLayoutConfig = {
  displayName: string;
  slots: GridSlotConfig[];
  duration: number;
  id: number;
};
// === Grid: One Images ===
export const OneImageGridConfig: GridLayoutConfig = {
  id: 1,
  displayName: "default",
  duration: 5,
  slots: [
    {
      mediaType: "image",
      media: null,
      mediaId: null,
      ImageFile: null,
      scale: "fit",
      index: 0,
      widget: null,
    },
  ],
};

// === Grid: Two Images ===
export const TwoByTwoConfig: GridLayoutConfig = {
  id: 2,
  displayName: "twobyTwo",
  duration: 5,
  slots: [
    {
      mediaType: "image",
      media: null,
      ImageFile: null,
      mediaId: null,
      scale: "fit",
      index: 0,
      widget: null,
    },
    {
      mediaType: "image",
      media: null,
      ImageFile: null,
      scale: "fill",
      mediaId: null,
      index: 1,
      widget: null,
    },
  ],
};

// === Grid: Two Images ===
export const TwoByTwoColConfig: GridLayoutConfig = {
  id: 3,
  displayName: "twobyTwoCol",
  duration: 5,
  slots: [
    {
      mediaType: "image",
      media: null,
      mediaId: null,
      ImageFile: null,
      scale: "fit",
      index: 0,
      widget: null,
    },
    {
      mediaType: "image",
      media: null,
      ImageFile: null,
      mediaId: null,
      scale: "fill",
      index: 1,
      widget: null,
    },
  ],
};
// === Grid: Three Images ===
export const ThreeColGridConfig: GridLayoutConfig = {
  id: 4,
  displayName: "threeCol",
  duration: 5,
  slots: [
    {
      mediaType: "image",
      media: null,
      ImageFile: null,
      mediaId: null,
      scale: "fit",
      index: 0,
      widget: null,
    },
    {
      mediaType: "image",
      media: null,
      ImageFile: null,
      mediaId: null,
      scale: "fill",
      index: 1,
      widget: null,
    },
    {
      mediaType: "image",
      media: null,
      mediaId: null,
      ImageFile: null,
      scale: "fill",
      index: 2,
      widget: null,
    },
  ],
};
export const ThreeRowGridConfig: GridLayoutConfig = {
  id: 5,
  displayName: "threeRow",
  duration: 5,
  slots: [
    {
      mediaType: "image",
      media: null,
      ImageFile: null,
      mediaId: null,
      scale: "fit",

      index: 0,
      widget: null,
    },
    {
      mediaType: "image",
      media: null,
      ImageFile: null,
      mediaId: null,
      scale: "fill",
      index: 1,
      widget: null,
    },
    {
      mediaType: "image",
      media: null,
      ImageFile: null,
      mediaId: null,
      scale: "fill",
      index: 2,
      widget: null,
    },
  ],
};
// === Grid: Four Images ===
export const FourImageGridConfig: GridLayoutConfig = {
  id: 6,
  displayName: "fourGrid",
  duration: 5,
  slots: [
    {
      mediaType: "image",
      media: null,
      scale: "fit",
      index: 0,
      ImageFile: null,
      mediaId: null,
      widget: null,
    },
    {
      mediaType: "image",
      media: null,
      ImageFile: null,
      mediaId: null,
      scale: "fill",
      index: 1,
      widget: null,
    },
    {
      mediaType: "image",
      media: null,
      ImageFile: null,
      mediaId: null,
      scale: "fill",
      index: 2,
      widget: null,
    },
    {
      mediaType: "image",
      media: null,
      ImageFile: null,
      mediaId: null,
      scale: "fill",
      index: 3,
      widget: null,
    },
  ],
};
