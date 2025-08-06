import { ListVideo, ActivitySquare, Globe, AlertTriangle } from "lucide-react";
import { fetchPlaylistTypes } from "../../ReactQuery/PlaylistType/PlaylistTypeSlice";
import { useQuery } from "@tanstack/react-query";

const iconMap: Record<string, any> = {
  Normal: ListVideo,
  Interactive: ActivitySquare,
  Interactive_2: Globe,
};

const PlaylistTypeModal = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["playlist-types"],
    queryFn: fetchPlaylistTypes,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="animate-pulse flex items-start gap-4 p-4 rounded-lg border border-gray-300 bg-gray-100"
          >
            <div className="w-6 h-6 bg-gray-300 rounded-full mt-1" />
            <div className="space-y-2 w-full">
              <div className="h-4 w-1/3 bg-gray-300 rounded"></div>
              <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 border border-red-300 bg-red-50 rounded-lg text-red-600">
        <AlertTriangle size={20} />
        <span>Failed to load playlist types. Please try again later.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((type: any) => {
        const Icon = iconMap[type.type] || ListVideo;

        return (
          <div
            key={type.id}
            className="flex items-start gap-4 p-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition cursor-pointer"
          >
            <div className="mt-1 text-[var(--mainred)]">
              <Icon size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--black)]">
                {type.type} Playlist
              </h2>
              <p className="text-sm text-gray-500">{type.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlaylistTypeModal;
