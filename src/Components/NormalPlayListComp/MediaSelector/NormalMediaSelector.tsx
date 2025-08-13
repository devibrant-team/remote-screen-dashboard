// ./MediaSelector/NormalMediaSelector.tsx
import React from "react";
import { useGetMedia } from "../../../ReactQuery/Media/useGetMedia";
import { Image as ImageIcon, Film, RefreshCw } from "lucide-react";

const SkeletonCard = () => (
  <div className="animate-pulse rounded-xl border border-gray-200 bg-white overflow-hidden">
    <div className="aspect-[4/3] bg-gray-100" />
    <div className="p-2">
      <div className="h-3 w-2/3 bg-gray-100 rounded" />
    </div>
  </div>
);

const NormalMediaSelector: React.FC = () => {
  const { data: media, isLoading, isError, error, refetch, isFetching } = useGetMedia(true);
console.log(media)
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">My Media</h2>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Body */}
      <div className="px-4 pb-4">
        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="mb-2 font-medium">Error loading media</p>
            <p className="mb-3">{error instanceof Error ? error.message : "Unknown error"}</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && (!media || media.length === 0) && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-sm text-gray-600">No media yet.</p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !isError && media && media.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {media.map((item) => {
              const isVideo = item.type?.startsWith("video") || item.type === "video";
              return (
                <div
                  key={item.id}
                  className="group relative rounded-xl border-2 border-gray-300 bg-white overflow-hidden hover:shadow-sm transition"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                    {isVideo ? (
                      <video
                        src={item.media}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        preload="metadata"
                        muted
                        playsInline
                        controls={false}
                      />
                    ) : (
                      <img
                        src={item.media}
                        alt={`media-${item.id}`}
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                    )}
                  </div>

                  {/* Badge */}
                  <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {isVideo ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                    <span>{isVideo ? "Video" : "Image"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NormalMediaSelector;
