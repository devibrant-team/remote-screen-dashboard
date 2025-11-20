import React from "react";
import { Tag } from "lucide-react";

type MediaBottomBarProps = {
  selectedCount: number;
  onClear: () => void;
  onAssign: () => void;
};

export const MediaBottomBar: React.FC<MediaBottomBarProps> = ({
  selectedCount,
  onClear,
  onAssign,
}) => {
  if (selectedCount <= 0) return null;

  return (
    <div className="fixed bottom-0 left-60 right-0 z-30 pointer-events-none">
      {/* left-60 = sidebar width; change if your sidebar is different */}
      <div className="pointer-events-auto border-t border-gray-200 bg-white px-6 py-3 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          {/* Left: dot + text */}
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span>
              {selectedCount}{" "}
              {selectedCount === 1 ? "media selected" : "media items selected"}
            </span>
          </div>

          {/* Right: buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center justify-center rounded-full border border-red-300 
                         bg-white px-4 py-2 text-sm font-medium text-red-500 
                         hover:bg-red-50 transition"
            >
              Clear Selection
            </button>

            <button
              type="button"
              onClick={onAssign}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 
                         px-4 py-2 text-sm font-semibold text-white shadow-sm 
                         hover:bg-red-600 active:bg-red-700 transition"
            >
              <Tag className="h-4 w-4" />
              <span>Assign to Tag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
