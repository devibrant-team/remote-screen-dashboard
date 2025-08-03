export type GridSlotConfig = {
  image?: any;
  name: string;
  scale: "fit" | "fill" | "stretch" | "blur" | "original";
  index: number;
};


export type GridLayoutConfig = {

  displayName: string;   
  slots: GridSlotConfig[];
};

export const gridTemplates: GridLayoutConfig[] = [
  {

    displayName: "Normal",
    slots: [
      {
        name: "Image",
        scale: "fit",
        index: 0
      }
    ]
  }
];
