import ImageSlider, { type ImagePreview } from "./ImageSlider";
import type { SlideItem } from "../shared/SharedSlides";

export default function PreviewArrange({
  slides,
  onReplace,
  onDelete,
  onReorder,
}: {
  slides: SlideItem[];
  onReplace: (index: number, file: File) => void;
  onDelete: (index: number) => void;
  onReorder: (next: SlideItem[]) => void;
}) {
  const adapt = slides as unknown as ImagePreview[];
  const handleReorder = (arr: ImagePreview[]) => onReorder(arr as unknown as SlideItem[]);
  return slides.length === 0 ? (
    <div className="rounded-lg bg-slate-50 border border-dashed border-slate-200 p-6 text-sm text-slate-600 text-center">
      No slides yet. Upload or select from the library to see a preview here.
    </div>
  ) : (
    <ImageSlider
      images={adapt}
      handleReplaceImage={onReplace}
      handleDeleteImage={onDelete}
      handleReorder={handleReorder}
    />
  );
}
