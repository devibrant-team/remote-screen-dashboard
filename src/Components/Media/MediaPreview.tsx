// Components/Shared/MediaPreview.tsx
import React from "react";
import { useVideoThumbnail } from "../../Hook/Playlist/useVideoThumbnail";

const FALLBACK_IMG =
  "https://dummyimage.com/640x360/eeeeee/9aa0a6&text=No+Preview";

type Props = {
  src: string;
  type?: string;
  alt: string;
  className?: string;
};

const MediaPreview: React.FC<Props> = ({ src, type, alt, className }) => {
  const isVideo = type === "video" || type?.startsWith("video");
  const { thumb } = useVideoThumbnail(isVideo ? src : undefined, 1);

  if (isVideo) {
    if (thumb) {
      return (
        <img
          src={thumb}
          alt={alt}
          className={`object-cover ${className ?? ""}`}
          draggable={false}
        />
      );
    }
    return (
      <div
        className={`flex items-center justify-center bg-black/70 text-white text-xs ${className ?? ""}`}
      >
        Loading…
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
      }}
      loading="lazy"
      draggable={false}
      className={`object-cover ${className ?? ""}`}
    />
  );
};

export default MediaPreview;
