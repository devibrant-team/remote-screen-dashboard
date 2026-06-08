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

const MediaPreview: React.FC<Props> = ({
  src,
  type,
  alt,
  className,
}) => {
  const isVideo = type === "video" || type?.startsWith("video");

  const { thumb } = useVideoThumbnail(
    isVideo ? src : undefined,
    1
  );

  if (isVideo) {
    return (
      <img
        src={thumb || FALLBACK_IMG}
        alt={alt}
        draggable={false}
        className={`object-cover ${className ?? ""}`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
        }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      loading="lazy"
      className={`object-cover ${className ?? ""}`}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
      }}
    />
  );
};

export default MediaPreview;
