import React, { useRef } from "react";

interface ImagePreview {
  file: File;
  url: string;
}

interface ImageSliderProps {
  images: ImagePreview[];
  setImages: React.Dispatch<React.SetStateAction<ImagePreview[]>>;
  handleReplaceImage: (index: number, file: File) => void;
  handleDeleteImage: (index: number) => void;
  handleReorder: (newImages: ImagePreview[]) => void;
}

const ImageSlider: React.FC<ImageSliderProps> = ({
  images,
  // setImages,
  handleReplaceImage,
  handleDeleteImage,
  handleReorder,
}) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDrop = () => {
    if (
      dragItem.current === null ||
      dragOverItem.current === null ||
      dragItem.current === dragOverItem.current
    )
      return;

    const reordered = [...images];
    const dragged = reordered[dragItem.current];
    reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, dragged);
    handleReorder(reordered);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="mb-6 flex gap-4 overflow-x-auto pb-2 scroll-smooth md:hide-scrollbar">
      {images.map((img, index) => (
        <div
          key={index}
          className="flex flex-col items-center min-w-[120px] sm:min-w-[150px] relative group"
        >
          <div
            className="w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] border border-gray-300 rounded-xl overflow-hidden shadow bg-white relative cursor-move group"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDrop}
          >
            <img
              src={img.url}
              alt={`preview-${index}`}
              className="w-full h-full object-cover"
            />

            <div
              onClick={() =>
                document.getElementById(`replace-${index}`)?.click()
              }
              className="absolute inset-0 bg-gray-900/60 flex items-center justify-center text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              Replace
            </div>

            <input
              id={`replace-${index}`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files && handleReplaceImage(index, e.target.files[0])
              }
            />

            <button
              onClick={() => handleDeleteImage(index)}
              className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full bg-red-600 text-white shadow-md transition hover:bg-red-700"
              title="Delete Slide"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7L5 7M10 11v6m4-6v6M7 7h10l-1 13H8L7 7zM9 7V4h6v3"
                />
              </svg>
            </button>
          </div>

          <div className="mt-2 text-sm text-gray-700 font-medium text-center">
            Slide {index + 1}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageSlider;
